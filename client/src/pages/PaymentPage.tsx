import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { paymentApi } from '../services/api';
import { useApi } from '../hooks';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

const stripeElementOptions = {
  style: {
    base: { 
      fontSize: '16px', 
      color: '#424770', 
      '::placeholder': { color: '#aab7c4' } 
    },
    invalid: { color: '#9e2146' },
  },
};

interface CheckoutFormProps {
  clientSecret: string;
  email: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ clientSecret, email }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      setError('カード情報の取得に失敗しました');
      setProcessing(false);
      return;
    }
    
    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { email },
        },
      });

      if (paymentError) {
        setError(paymentError.message || '決済処理でエラーが発生しました');
      } else if (paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        setTimeout(() => {
          navigate('/completion');
        }, 1000);
      } else {
        setError(`決済ステータスが予期せぬ状態です: ${paymentIntent.status}`);
      }
    } catch (err) {
      setError('決済処理中にエラーが発生しました');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form-container">
      <h2 className="form-title">お支払い情報の入力</h2>
      <p className="form-description">月額980円の会費のお支払いとなります。</p>
      
      <div className="form-group">
        <label htmlFor="card-number">カード番号</label>
        <div className="stripe-element-container">
          <CardNumberElement 
            id="card-number" 
            options={stripeElementOptions} 
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group form-group-half">
          <label htmlFor="card-expiry">有効期限 (MM/YY)</label>
          <div className="stripe-element-container">
            <CardExpiryElement 
              id="card-expiry" 
              options={stripeElementOptions} 
            />
          </div>
        </div>
        <div className="form-group form-group-half">
          <label htmlFor="card-cvc">セキュリティコード</label>
          <div className="stripe-element-container">
            <CardCvcElement 
              id="card-cvc" 
              options={stripeElementOptions} 
            />
          </div>
        </div>
      </div>
      
      <div className="form-navigation" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: '10px' }}>
        <button 
          type="submit" 
          disabled={processing || succeeded || !stripe || !clientSecret} 
          className="submit-btn"
        >
          {processing ? (
            <LoadingSpinner size="small" message="" />
          ) : succeeded ? (
            '決済完了'
          ) : (
            '支払いを確定する'
          )}
        </button>
      </div>
      
      {error && (
        <ErrorMessage message={error} className="mt-4" />
      )}
      
      {succeeded && (
        <div className="liff-message success" style={{ marginTop: '20px' }}>
          お支払いが完了しました。画面を切り替えています...
        </div>
      )}
    </form>
  );
};

interface LocationState {
  email: string;
  stripeCustomerId: string;
}

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, error, execute } = useApi<{ clientSecret: string }>();
  
  const [clientSecret, setClientSecret] = useState('');
  const state = location.state as LocationState | null;

  useEffect(() => {
    const initializePayment = async () => {
      if (!state?.email || !state?.stripeCustomerId) {
        navigate('/register');
        return;
      }

      const result = await execute(() =>
        paymentApi.createPaymentIntent({
          amount: 980,
          email: state.email,
          stripeCustomerId: state.stripeCustomerId,
        })
      );

      if (result?.clientSecret) {
        setClientSecret(result.clientSecret);
      } else {
        // If API call failed, navigate back to register
        navigate('/register');
      }
    };

    initializePayment();
  }, [state, execute, navigate]);

  if (loading || !clientSecret) {
    return (
      <div className="form-container">
        <LoadingSpinner message="決済情報を準備中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-container">
        <h2 className="form-title">決済準備エラー</h2>
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()}
        />
        <div className="form-navigation" style={{ justifyContent: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => navigate('/register')} 
            className="prev-btn"
          >
            登録画面に戻る
          </button>
        </div>
      </div>
    );
  }
    
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <div className="form-container">
        <CheckoutForm 
          clientSecret={clientSecret} 
          email={state?.email || ''} 
        />
      </div>
    </Elements>
  );
};

export default PaymentPage;