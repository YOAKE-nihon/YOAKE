import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const stripeElementOptions = {
  style: {
    base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
    invalid: { color: '#9e2146' },
  },
};

const CheckoutForm = ({ clientSecret, email }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        setProcessing(true);
        setError(null);
        const cardElement = elements.getElement(CardNumberElement);
        if (cardElement == null) return;
        
        const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: { email: email },
            },
        });

        if (paymentError) {
            setError(paymentError.message);
            setProcessing(false);
        } else if (paymentIntent.status === 'succeeded') {
            setSucceeded(true);
            setProcessing(false);
            alert('決済が完了しました！');
            navigate('/completion');
        } else {
            setError(`決済ステータスが予期せぬ状態です: ${paymentIntent.status}`);
            setProcessing(false);
        }
    };

    return (
      <form onSubmit={handleSubmit} className="payment-form-container">
        <h2 className="form-title">お支払い情報の入力</h2>
        <p className="form-description">月額980円の会費のお支払いとなります。</p>
        <div className="form-group"><label htmlFor="card-number">カード番号</label><div className="stripe-element-container"><CardNumberElement id="card-number" options={stripeElementOptions} /></div></div>
        <div className="form-row">
            <div className="form-group form-group-half"><label htmlFor="card-expiry">有効期限 (MM/YY)</label><div className="stripe-element-container"><CardExpiryElement id="card-expiry" options={stripeElementOptions} /></div></div>
            <div className="form-group form-group-half"><label htmlFor="card-cvc">セキュリティコード</label><div className="stripe-element-container"><CardCvcElement id="card-cvc" options={stripeElementOptions} /></div></div>
        </div>
        <div className="form-navigation" style={{justifyContent: 'center', borderTop: 'none', paddingTop: '10px'}}>
          <button type="submit" disabled={processing || succeeded || !stripe || !clientSecret} className="submit-btn">{processing ? "処理中…" : (succeeded ? "決済完了" : "支払いを確定する")}</button>
        </div>
        {error && <div className="error-message" role="alert" style={{marginTop: '20px'}}>{error}</div>}
        {succeeded && <p style={{ color: 'green', textAlign: 'center', marginTop: '20px' }}>お支払いが完了しました。</p>}
      </form>
    );
};

function PaymentPage() {
    const [clientSecret, setClientSecret] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { email, stripeCustomerId } = location.state || {};

    useEffect(() => {
        if (!email || !stripeCustomerId) {
            alert('決済情報が見つかりません。登録からやり直してください。');
            navigate('/register');
            return;
        }
        const amount = 980;
        const apiUrl = '/api/create-payment-intent';

        axios.post(apiUrl, { amount, email, stripeCustomerId })
            .then(res => setClientSecret(res.data.clientSecret))
            .catch(err => {
                console.error("決済準備エラー:", err);
                alert(err.response?.data?.message || "決済の準備に失敗しました。");
                navigate('/register');
            });
    }, [email, stripeCustomerId, navigate]);

    if (!clientSecret) {
        return (
            <div className="form-container">
                <h2 className="form-title">決済情報を準備中...</h2>
                <p style={{textAlign: 'center'}}>しばらくお待ちください。</p>
            </div>
        );
    }
    
    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <div className="form-container">
                <CheckoutForm clientSecret={clientSecret} email={email} />
            </div>
        </Elements>
    );
};

export default PaymentPage;
