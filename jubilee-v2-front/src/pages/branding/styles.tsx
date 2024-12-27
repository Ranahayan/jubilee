import styled from "styled-components";
import { getColor, getSize, responsive } from "~/helpers/style";

export const BrandingSettings = styled.div`
  background-color: ${getColor("white")};
  padding: ${getSize(2.2)};
  border-radius: ${getSize(0.6)};
  position: relative;
  margin-bottom: ${getSize(2.2)};
  display: flex;
  flex-direction: column;
  gap: ${getSize(2.2)};

  h3 {
    font-weight: 500;
    margin-top: 0;
    margin-bottom: 0;
  }

  ${responsive("laptop")} {
    flex-direction: row;
  }
`;

export const BrandingSettingsForm = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const BrandedInvoiceFields = styled.div`
	background-color: ${getColor("white")};
  padding: ${getSize(2.2)};
  border-radius: ${getSize(0.6)};
  position: relative;

  h3 {
    font-weight: 500;
    margin-top: 0;
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${getSize(0.8)};
`;

export const Loading = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${getColor("white")};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  border-radius: ${getSize(0.6)};

  svg * {
    stroke: ${getColor("primary")};
  }
`;
