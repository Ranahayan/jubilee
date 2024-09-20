import { CreateCard } from "./createCard";
import { InfoCard } from "./infoCard";
import { SVGIcon } from "../SVG/types";
import { faTrash } from "@fortawesome/pro-solid-svg-icons";
import { SVG } from "../SVG";
import * as S from "./styles";

type Props = {
  title: string;
  isCreating?: boolean;
  img?: string,
  isPublished?: boolean,
  created?: string
  onClick?: () => void;
  handleDelete?: () => void;
}

export const Card = ({ title, isCreating = false, img, isPublished = false, created, onClick, handleDelete }: Props) => {
  return (
    <S.CardContainer>
      {isCreating ? <CreateCard title={title} onClick={onClick} /> : (
        <InfoCard
          title={title}
          isPublished={isPublished}
          img={img}
          created={created}
          onClick={onClick}
        />
      )}
      {handleDelete ? <S.DeleteIconContainer onClick={handleDelete}>
        <SVG icon={faTrash as SVGIcon} color="white" />
      </S.DeleteIconContainer> : null}
    </S.CardContainer>
  )
}
