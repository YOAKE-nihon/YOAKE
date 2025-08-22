// --- 1. 必要なライブラリの読み込み ---
require("dotenv").config(); // .envファイルから環境変数を読み込む
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
const axios = require("axios"); // LINEのIDトークン検証に必要
const line = require("@line/bot-sdk"); // LINE Messaging APIの操作に必要

const app = express();

// --- 2. ミドルウェアの設定 ---
// CORSを許可し、JSON形式のリクエストボディを扱えるようにする
app.use(cors());
app.use(express.json());

// --- 3. 外部サービス (Supabase, LINE) のクライアントを初期化 ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const lineClient = new line.Client({
  channelAccessToken: process.env.LINE_MESSAGING_API_TOKEN,
});

// --- 4. APIエンドポイントの定義 ---

/**
 * @endpoint POST /api/register
 * @description LIFFアプリからの新規登録リクエストを処理する
 * @body { idToken: string, surveyData: object }
 */
app.post("/api/register", async (req, res) => {
  console.log("--- [/api/register] Received request from LIFF ---");
  const { idToken, surveyData } = req.body;
  if (!idToken || !surveyData) {
    return res.status(400).json({
      success: false,
      message: "IDトークンまたはアンケートデータが不足しています。",
    });
  }

  try {
    // Step 1: LINEのIDトークンを検証し、LINEユーザー情報を取得
    const params = new URLSearchParams();
    params.append("id_token", idToken);
    params.append("client_id", process.env.LINE_LOGIN_CHANNEL_ID);
    const lineResponse = await axios.post(
      "https://api.line.me/oauth2/v2.1/verify",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const lineProfile = lineResponse.data;
    const lineUserId = lineProfile.sub;
    console.log(`[LOG] LINE Token verified. LINE User ID: ${lineUserId}`);

    // Step 2: Supabase Authにユーザーが存在するか確認し、なければ作成
    let finalUser;
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers({ email: surveyData.email });
    if (listError) throw listError;
    if (users && users.length > 0) {
      finalUser = users[0];
      console.log(
        `[LOG] User with email ${surveyData.email} already exists. User ID: ${finalUser.id}`
      );
    } else {
      const {
        data: { user },
        error: createError,
      } = await supabase.auth.admin.createUser({
        email: surveyData.email,
        email_confirm: true,
        user_metadata: { name: lineProfile.name, picture: lineProfile.picture },
      });
      if (createError) throw createError;
      finalUser = user;
      console.log(`[LOG] New Supabase Auth user created: ${finalUser.id}`);
    }

    // Step 3: Stripeに顧客情報を作成
    const stripeCustomer = await stripe.customers.create({
      email: surveyData.email,
      name: lineProfile.name,
      metadata: { supabase_user_id: finalUser.id, line_user_id: lineUserId },
    });
    console.log(`[LOG] Stripe customer created: ${stripeCustomer.id}`);

    // Step 4: プロフィール情報とアンケート回答をDBに保存 (Upsert: 存在すれば更新、なければ新規作成)
    await supabase.from("profiles").upsert({
      id: finalUser.id,
      name: lineProfile.name,
      avatar_url: lineProfile.picture,
      line_user_id: lineUserId,
      email: surveyData.email,
      gender: surveyData.gender,
      birth_date: surveyData.birthDate,
      phone: surveyData.phone,
      experience_years: surveyData.experienceYears,
      industry: surveyData.industry,
      job_type: surveyData.jobType,
      stripe_customer_id: stripeCustomer.id,
      updated_at: new Date(),
    });
    console.log(`[LOG] Profile data upserted for: ${finalUser.id}`);

    await supabase
      .from("survey_responses")
      .upsert(
        { user_id: finalUser.id, ...surveyData },
        { onConflict: "user_id" }
      );
    console.log(`[LOG] Survey response upserted for: ${finalUser.id}`);

    // Step 5: 登録完了後、LINEにプッシュメッセージを送信して連携を促す
    try {
      const liffUrl = `https://liff.line.me/${process.env.LIFF_ID_LINKING}`;
      console.log(`[LOG] Sending push message to user: ${lineUserId}`);
      const message = {
        type: "template",
        altText: "アカウント連携のお願い",
        template: {
          type: "buttons",
          thumbnailImageUrl:
            "https://storage.googleapis.com/be-a-hero-images/thumbnail.jpg", // 例: 公開されている画像URL
          imageAspectRatio: "rectangle",
          imageSize: "cover",
          title: "会員登録ありがとうございます！",
          text: "サービスを最大限にご利用いただくため、最後にLINEアカウントとの連携をお願いします。",
          actions: [
            { type: "uri", label: "アカウント連携に進む", uri: liffUrl },
          ],
        },
      };
      await lineClient.pushMessage(lineUserId, [message]);
      console.log(`[LOG] Push message sent successfully.`);
    } catch (pushError) {
      console.error(
        "[SERVER WARNING] Failed to send push message:",
        pushError.originalError
          ? pushError.originalError.response.data
          : pushError.message
      );
    }

    // Step 6: フロントエンドに成功を通知
    res.status(201).json({
      success: true,
      message: "ユーザー登録成功",
      stripeCustomerId: stripeCustomer.id,
    });
  } catch (error) {
    console.error(
      "[SERVER ERROR in /api/register]",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      success: false,
      message: "サーバー処理中にエラーが発生しました。",
    });
  }
});

/**
 * @endpoint POST /api/create-payment-intent
 * @description 決済処理の準備を行う
 * @body { amount: number, email: string, stripeCustomerId: string }
 */
app.post("/api/create-payment-intent", async (req, res) => {
  const { amount, email, stripeCustomerId } = req.body;
  if (!amount || !email || !stripeCustomerId) {
    return res.status(400).json({
      success: false,
      message: "金額、メールアドレス、顧客IDは必須です。",
    });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount),
      currency: "jpy",
      customer: stripeCustomerId,
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("[SERVER ERROR] Stripe PaymentIntent creation error:", error);
    res
      .status(500)
      .json({ success: false, message: "決済情報の作成に失敗しました。" });
  }
});

/**
 * @endpoint POST /api/link-line-account
 * @description アカウント連携LIFFから呼び出され、リッチメニューを会員用のものに切り替える
 * @body { email: string, lineUserId: string }
 */
app.post("/api/link-line-account", async (req, res) => {
  console.log("\n--- [/api/link-line-account] Received request ---");
  const { email, lineUserId } = req.body;
  const memberRichMenuId = process.env.RICH_MENU_ID_MEMBER;
  if (!email || !lineUserId || !memberRichMenuId) {
    return res.status(400).json({
      success: false,
      message: "リクエストに必要な情報が不足しています。",
    });
  }

  try {
    // 1. LINE Messaging APIを呼び出して、リッチメニューをユーザーに紐付ける
    console.log(
      `[API CALL] Linking rich menu ${memberRichMenuId} to user ${lineUserId}...`
    );
    await lineClient.linkRichMenuToUser(lineUserId, memberRichMenuId);

    console.log(
      `[SUCCESS] Successfully linked member rich menu to user: ${lineUserId}`
    );
    res
      .status(200)
      .json({ success: true, message: "LINEアカウントの連携が完了しました。" });
  } catch (error) {
    console.error("\n❌ [/api/link-line-account] エラーが発生しました ❌");
    if (error.originalError) {
      // LINE Bot SDKのエラーの場合
      console.error("ステータスコード:", error.originalError.response.status);
      console.error(
        "エラー内容:",
        JSON.stringify(error.originalError.response.data, null, 2)
      );
    } else {
      console.error("予期せぬエラー:", error.message);
    }
    res.status(500).json({
      success: false,
      message: "サーバー処理中にエラーが発生しました。",
    });
  }
});

/**
 * @endpoint POST /api/check-in
 * @description 店舗認証LIFFから呼び出され、来店記録を作成する
 * @body { lineUserId: string, storeId: number }
 */
app.post("/api/check-in", async (req, res) => {
  console.log("\n--- [/api/check-in] Received request ---");
  const { lineUserId, storeId } = req.body;

  if (!lineUserId || !storeId) {
    return res
      .status(400)
      .json({ success: false, message: "LINEユーザーIDと店舗IDは必須です。" });
  }

  try {
    // Step 1: 受け取ったlineUserIdを元に、profilesテーブルから内部のユーザーID(UUID)を取得
    console.log(`[DB] Finding profile for LINE User ID: ${lineUserId}`);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id") // 内部的なIDだけを取得
      .eq("line_user_id", lineUserId)
      .single();

    // ユーザーが見つからなかった場合はエラー
    if (profileError || !profile) {
      throw new Error("LINE IDに紐づくユーザーが見つかりません。");
    }
    const internalUserId = profile.id;
    console.log(`[DB] Found user. Internal User ID: ${internalUserId}`);

    // Step 2: visitsテーブルに来店記録をINSERT（挿入）する
    console.log(
      `[DB] Inserting visit record for User ${internalUserId} at Store ${storeId}`
    );
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        user_id: internalUserId,
        store_id: storeId,
        // check_in_at はデフォルトで現在時刻が入るので、ここでは指定不要
      })
      .select("id") // 作成された来店記録のIDを取得
      .single();

    if (visitError) {
      throw visitError;
    }
    console.log(`[DB SUCCESS] Visit record created. Visit ID: ${visit.id}`);

    // Step 3: フロントエンド（LIFFアプリ）に来店記録のIDを返す
    // このIDを使って、次のアンケート回答をこの来店記録に紐付ける
    res.status(201).json({ success: true, visitId: visit.id });
  } catch (error) {
    console.error("\n❌ [/api/check-in] エラーが発生しました ❌");
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "来店記録の作成中にエラーが発生しました。",
    });
  }
});

/**
 * @endpoint POST /api/submit-visit-survey
 * @description 来店後アンケートの回答を受け取り、対応する来店記録を更新する
 * @body { visitId: number, visitType: string, visitPurpose: string, companionIndustries: string[], companionJobTypes: string[] }
 */
app.post("/api/submit-visit-survey", async (req, res) => {
  console.log("\n--- [/api/submit-visit-survey] Received request ---");
  const {
    visitId,
    visitType,
    visitPurpose,
    companionIndustries,
    companionJobTypes,
  } = req.body;

  // visitIdは、どの来店記録に対するアンケートかを特定するために必須
  if (!visitId) {
    return res
      .status(400)
      .json({ success: false, message: "来店記録IDが必要です。" });
  }

  try {
    // Step 1: 受け取ったアンケート内容をオブジェクトにまとめる
    const surveyData = {
      visit_type: visitType,
      visit_purpose: visitPurpose,
      companion_industries: companionIndustries,
      companion_job_types: companionJobTypes,
    };
    console.log(
      `[DB] Updating visit record (ID: ${visitId}) with survey data:`,
      surveyData
    );

    // Step 2: visitsテーブルの、指定されたvisitIdの行をUPDATE（更新）する
    const { error } = await supabase
      .from("visits")
      .update(surveyData)
      .eq("id", visitId);

    // 更新中にエラーがあれば、エラーを投げる
    if (error) {
      throw error;
    }
    console.log(
      `[DB SUCCESS] Visit record (ID: ${visitId}) updated successfully.`
    );

    // Step 3: フロントエンドに成功を通知
    res.status(200).json({
      success: true,
      message: "アンケートへのご協力ありがとうございました！",
    });
  } catch (error) {
    console.error("\n❌ [/api/submit-visit-survey] エラーが発生しました ❌");
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "アンケートの保存中にエラーが発生しました。",
    });
  }
});

/**
 * @endpoint GET /api/membership-card
 * @description デジタル会員証に必要なデータをまとめて取得する
 * @query { lineUserId: string }
 */
app.get("/api/membership-card", async (req, res) => {
  console.log("\n--- [/api/membership-card] Received request ---");
  const { lineUserId } = req.query; // GETリクエストなので req.query から取得

  if (!lineUserId) {
    return res
      .status(400)
      .json({ success: false, message: "LINEユーザーIDが必要です。" });
  }

  try {
    // Step 1: lineUserIdを元に、ユーザーのプロフィール情報を取得
    console.log(`[DB] Finding profile for LINE User ID: ${lineUserId}`);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .eq("line_user_id", lineUserId)
      .single();

    if (profileError || !profile) {
      throw new Error("ユーザーが見つかりません。");
    }
    console.log(`[DB] Found user. Internal User ID: ${profile.id}`);

    // Step 2: ユーザーの全来店履歴を、店舗名も一緒に取得
    const { data: visits, error: visitsError } = await supabase
      .from("visits")
      .select(
        `
        check_in_at,
        visit_purpose,
        companion_industries,
        companion_job_types,
        stores ( name ) 
      `
      ) // storesテーブルからnameをJOINして取得
      .eq("user_id", profile.id)
      .order("check_in_at", { ascending: false }); // 新しい順にソート

    if (visitsError) {
      throw visitsError;
    }
    console.log(`[DB] Found ${visits.length} visit records.`);

    // Step 3: 取得したデータを、フロントエンドで使いやすいように集計・加工

    // 全来店履歴から、同行者の「業界」「職種」、そして「来店目的」のリストを作成
    const allCompanionIndustries = visits.flatMap(
      (v) => v.companion_industries || []
    );
    const allCompanionJobTypes = visits.flatMap(
      (v) => v.companion_job_types || []
    );
    const allVisitPurposes = visits.map((v) => v.visit_purpose).filter(Boolean); // nullや空文字を除外

    // 各項目が何回出現したかをカウントするヘルパー関数
    const aggregateCounts = (arr) =>
      arr.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {});

    // 最も多く来店した店舗（お気に入り店舗）を計算
    const storeVisits = aggregateCounts(visits.map((v) => v.stores.name));
    const favoriteStore =
      Object.keys(storeVisits).sort(
        (a, b) => storeVisits[b] - storeVisits[a]
      )[0] || "なし";

    // フロントエンドに返す最終的なデータを作成
    const responseData = {
      profile: {
        name: profile.name,
        avatarUrl: profile.avatar_url,
      },
      stats: {
        totalVisits: visits.length,
        favoriteStore: favoriteStore,
        // 直近の来店履歴を2件だけ抜き出す
        recentVisits: visits.slice(0, 2).map((v) => ({
          date: v.check_in_at,
          storeName: v.stores.name,
        })),
      },
      // グラフ表示用の集計データ
      charts: {
        companionIndustry: aggregateCounts(allCompanionIndustries),
        companionJobType: aggregateCounts(allCompanionJobTypes),
        visitPurpose: aggregateCounts(allVisitPurposes),
      },
    };

    // Step 4: フロントエンドに成功応答と加工済みデータを返す
    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("\n❌ [/api/membership-card] エラーが発生しました ❌");
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "会員証データの取得中にエラーが発生しました。",
    });
  }
});

/**
 * @endpoint GET /api/visit-history
 * @description 特定ユーザーの全来店履歴を取得する
 * @query { lineUserId: string }
 */
app.get("/api/visit-history", async (req, res) => {
  console.log("\n--- [/api/visit-history] Received request ---");
  const { lineUserId } = req.query;

  if (!lineUserId) {
    return res
      .status(400)
      .json({ success: false, message: "LINEユーザーIDが必要です。" });
  }

  try {
    // Step 1: lineUserIdを元に、内部のユーザーID(UUID)を取得
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("line_user_id", lineUserId)
      .single();

    if (profileError || !profile) {
      throw new Error("ユーザーが見つかりません。");
    }
    const internalUserId = profile.id;

    // Step 2: ユーザーの全来店履歴を、店舗名と目的も一緒に取得
    const { data: visits, error: visitsError } = await supabase
      .from("visits")
      .select(
        `
       id,
       check_in_at,
       visit_purpose,
       stores ( name )
     `
      )
      .eq("user_id", internalUserId)
      .order("check_in_at", { ascending: false }); // 新しい順にソート

    if (visitsError) {
      throw visitsError;
    }
    console.log(
      `[DB] Found ${visits.length} total visit records for history page.`
    );

    // Step 3: フロントエンドに成功応答と履歴データを返す
    // フロントエンドで使いやすいように、不要な階層をなくす
    const formattedVisits = visits.map((v) => ({
      id: v.id,
      check_in_at: v.check_in_at,
      visit_purpose: v.visit_purpose,
      store_name: v.stores.name, // 'stores'オブジェクトから'name'を直接取り出す
    }));

    res.status(200).json({ success: true, data: formattedVisits });
  } catch (error) {
    console.error("\n❌ [/api/visit-history] エラーが発生しました ❌");
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "来店履歴の取得中にエラーが発生しました。",
    });
  }
});

// --- 5. サーバーの起動 ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
