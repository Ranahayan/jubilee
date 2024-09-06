import { formConfig } from "./form";
import { SignTemplate } from "~/components/sign-template";
import { useRegister } from "./useRegister";

const RegisterPage = () => {
  const handleRegister = useRegister();

  return (
    <SignTemplate
      type="signup"
      formConfig={formConfig}
      callback={handleRegister}
    />
  )
};

export default RegisterPage;
