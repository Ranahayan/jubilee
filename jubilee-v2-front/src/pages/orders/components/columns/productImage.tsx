import * as S from "../../styles";

interface IProductImageProps {
  image: string;
  alt: string;
}

export const ProductImage = ({ image, alt }: IProductImageProps) => {
  return <S.ProductImage src={image} alt={alt} />;
};
