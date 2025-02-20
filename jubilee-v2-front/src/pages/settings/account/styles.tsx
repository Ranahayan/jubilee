import styled from "styled-components";
import { SVG } from "~/components/ui/SVG";
import { getColor, getSize } from "~/helpers/style";

export const SectionTitle = styled.span`
  font-weight: 600;
  font-size: ${getSize(1.4)};
  line-height: ${getSize(2.0)};
  margin: 0;
`;

export const CreditCardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${getSize(1.6)};
  width: 100%;
  flex-direction: column;
`;

export const ButtonContainer = styled.div`
  display: flex;
  margin-top: ${getSize(1.6)};
  gap: ${getSize(1.6)};
  justify-content: flex-end;
`;

export const EmailContainer = styled.div`
  position: relative;
  width: 100%;

  & input {
    padding-left: ${getSize(4.2)};
  }
`;

export const EmailIcon = styled(SVG)`
  position: absolute;
  left: ${getSize(1.4)};
  top: 50%;
  transform: translateY(-50%);
  width: ${getSize(2.0)};
  height: ${getSize(2.0)};
  pointer-events: none;
`;

export const StyledAnchor = styled.a`
  color: ${getColor("primary")};
  text-decoration: underline;
  cursor: pointer;
`;