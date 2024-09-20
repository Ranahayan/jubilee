import Container from "../Container";
import * as S from "./styles";

type Props = { items: (string | null | undefined)[]; title?: string };

const List = ({ items, title }: Props) => {
  return (
    <Container
      flat
      flexDirection="column"
      alignItems="flex-start"
      gap={0.8}
      padding="0"
    >
      {title ? <S.ListTitle>{title}</S.ListTitle> : null}
      <S.List>
        {items.map((field) =>
          field ? <S.ListItem key={field}>{field}</S.ListItem> : null
        )}
      </S.List>
    </Container>
  );
};

export default List;
