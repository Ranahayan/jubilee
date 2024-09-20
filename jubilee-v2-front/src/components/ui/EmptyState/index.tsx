import FlexContainer from "~/components/ui/FlexContainer";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";
import Text from "~/components/ui/Text";
import { BoldText } from "./styles";

type Props = {
  title: string;
  description: string;
  icon: SVGIcon;
};

export const EmptyState = ({ title, description, icon }: Props) => {
  return (
    <FlexContainer flexDirection="column" gap={0.8} height="600px">
      <SVG icon={icon} color="secondary" size="2xl" />
      <BoldText>{title}</BoldText>
      <Text secondary>{description}</Text>
    </FlexContainer>
  );
};
