import Text from "../Text";
import FlexContainer from "../FlexContainer";
import * as S from "./styles";

interface IVariantOption {
  name: string;
  values: string[];
  activeItem?: string[];
  onClick: (variant: string) => void;
  isDisabled?: boolean;
}

const sizeMap = {
  "S": 1,      // Small
  "M": 2,      // Medium
  "L": 3,      // Large
  "XL": 4,     // Extra Large
  "XXL": 5,    // Double Extra Large
  "XXXL": 6,   // Triple Extra Large
  "4XL": 7,    // Four Extra Large
  "5XL": 8,    // Five Extra Large
  "6XL": 9,    // Six Extra Large
  "XXXS": 10,  // Triple Extra Small
  "TALL": 11,  // Tall
  "PETITE": 12 // Petite
};

const sortVariantOptions = (values: string[]) => {
  return values.sort((a, b) => {
    if (sizeMap[a.toUpperCase() as keyof typeof sizeMap] && sizeMap[b.toUpperCase() as keyof typeof sizeMap]) {
      return sizeMap[a.toUpperCase() as keyof typeof sizeMap] - sizeMap[b.toUpperCase() as keyof typeof sizeMap];
    }

    return a.localeCompare(b);
  });
}


const VariantOption = ({ name, values, activeItem, onClick, isDisabled }: IVariantOption) => {
  return (
    <FlexContainer
      flexDirection="column"
      gap={1.2}
      alignItems="flex-start"
      width="100%"
    >
      <Text>{name}</Text>
        <S.VariantContainer gap={1.2}>
          {sortVariantOptions(values).map((value) => (
            <S.VariantItem
              data-testid="variant-item"
              key={value}
              onClick={() => !isDisabled && onClick(value)}
              className={`${activeItem?.includes(value) ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
            >
              {value}
            </S.VariantItem>
          ))}
        </S.VariantContainer>
    </FlexContainer>
  );
};

export default VariantOption;