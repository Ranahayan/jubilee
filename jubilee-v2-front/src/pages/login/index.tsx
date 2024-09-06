import { SignTemplate } from "~/components/sign-template";
import { formConfig } from "./form";
import { useLogin } from "./useLogin";

const LoginPage = () => {
  const handleLogin = useLogin();

  return (
    <SignTemplate
      formConfig={formConfig}
      callback={handleLogin}
      type="signin"
    />
  );
};

export default LoginPage;
