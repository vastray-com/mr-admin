import { useNavigate } from 'react-router';
import { DEFAULT_PRIVATE_PATH } from '@/router/route.tsx';
import { ls } from '@/utils/ls.tsx';

const LoginPage = () => {
  const nav = useNavigate();
  const onLogin = () => {
    ls.token.set({
      at: 'aaa',
      rt: 'bbb',
    });
    nav(DEFAULT_PRIVATE_PATH);
  };

  return (
    <div>
      <h1>Login Page</h1>
      <p>Please enter your credentials to log in.</p>
      {/* Add your login form here */}
      <button type="button" onClick={onLogin}>
        login
      </button>
    </div>
  );
};

export default LoginPage;
