import { FormFieldConfigs, IFormHookProps } from "~/types/form";
import { BoldText } from "./styles";
import { Form } from "../Form";
import Container from "../Container";
import { faCrown } from "@fortawesome/pro-solid-svg-icons";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import { SVG } from "~/components/ui/SVG";
import Text from "../Text";
import { useTranslation } from "react-i18next";

type Props = {
  label: string;
  form: IFormHookProps;
  fields: FormFieldConfigs;
  showUpgradeIcon?: boolean;
  description?: string;
};

export const Section = ({
  label,
  form,
  fields,
  showUpgradeIcon,
  description,
}: Props) => {
  const fieldkeys = fields.map((elm) => elm.key);
  const { t } = useTranslation();

  return (
    <Container
      flexDirection="column"
      width="100%"
      alignItems="flex-start"
      padding="24px 20px">
      <BoldText>
        {showUpgradeIcon ? (
          <SVG icon={faCrown as Icon} color="#FFA41C" />
        ) : null}
        {label}
      </BoldText>
      {description && <Text secondary>{t(description)}</Text>}
      <Form {...form} upgradeIcon={faCrown as Icon} filterFields={fieldkeys} />
    </Container>
  );
};
