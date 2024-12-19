import { Terms } from "~/constants/terms";
import * as S from "./styles";
import { useTranslation } from "react-i18next";

const PolicyTerms = () => {
  const { t } = useTranslation();

  const renderAnchorOrText = (url: string, text: string) => {
    return url ? (
      <S.PolicyLinkText href={url} target="_blank" rel="noopener noreferrer">{text}</S.PolicyLinkText>
    ) : (
      text
    );
  };

  return (
    <S.PolicyText>
    {t('auth.signup.policy_agreement')}
    {' '}
    {renderAnchorOrText(Terms.privacy, t('auth.policies.privacy_policy'))}
    {', '}
    {renderAnchorOrText(Terms.refund, t('auth.policies.cancellation_refund_policy'))}
    {', and '}
    {renderAnchorOrText(Terms.terms, t('auth.policies.terms_conditions'))}
    .
  </S.PolicyText>
  )
}

export default PolicyTerms;
