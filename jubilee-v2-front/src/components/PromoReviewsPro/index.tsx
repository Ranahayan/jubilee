import React from "react";
import styled from "styled-components";

const Page = styled.div`
  filter: blur(1px);
  background-color: #0c0c0c1f;
  height: 100%;
  padding-inline: 12px;
  padding-top: 12px;
  width: 100%;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    margin-top: 24px;
  }
`;

const Header = styled.div`
  font-weight: 700;
  font-size: 20px;
  line-height: 1.2;
  color: #111827;
  margin-bottom: 20px;
`;

const Table = styled.div``;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.6fr 0.4fr;
  align-items: center;
  gap: 24px;
  padding: 22px 0px;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

const Th = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #4b5563;
`;

const ReviewCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #111827;
`;

const Stars = styled.div`
  display: inline-flex;
  gap: 6px;
`;

const Star = ({ filled = true }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? "#f59e0b" : "#e5e7eb"}
    xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.5l2.93 5.94 6.56.95-4.74 4.62 1.12 6.52L12 17.77 6.13 20.53l1.12-6.52L2.5 9.39l6.56-.95L12 2.5z" />
  </svg>
);

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #374151;
  font-weight: 600;
`;

const FlagUK = () => (
  <svg
    width="22"
    height="16"
    viewBox="0 0 60 40"
    xmlns="http://www.w3.org/2000/svg">
    <clipPath id="a">
      <path d="M0 0h60v40H0z" />
    </clipPath>
    <g clipPath="url(#a)">
      <path d="M0 0h60v40H0z" fill="#012169" />
      <path d="M0 0l60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0l60 40M60 0L0 40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

const DateCell = styled.div`
  color: #374151;
  font-weight: 600;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;

  @media (max-width: 768px) {
    top: 0px;
  }
`;

const Modal = styled.div`
  width: 460px;
  max-width: calc(100% - 48px);
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 30px 80px rgba(17, 24, 39, 0.25);
  border: 1px solid #e5e7eb;
  padding: 18px 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  pointer-events: auto;

  @media (max-width: 768px) {
    width: 460px;
    padding-inline: 16px;
  }

  @media (max-width: 650px) {
    width: auto;
    padding-inline: 16px;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: #111827;
`;

const BrandName = styled.span`
  font-size: 16px;
`;

const ModalBody = styled.div`
  grid-column: 1 / -1;
  margin-top: 6px;
`;

const H1 = styled.h1`
  margin: 0 0 10px 0;
  font-size: 16px;
  line-height: 1.2;
  color: #111827;
`;

const P = styled.p`
  margin: 0 0 20px 0;
  color: #6b7280;
  opacity: 0.6;
  font-family: Avenir;
  font-size: 13px;
  font-style: normal;
  font-weight: 500;
  line-height: 163.5%; /* 21.255px */
`;

const CTA = styled.button`
  appearance: none;
  border: none;
  background: #f3451f;
  color: #ffffff;
  font-weight: 600;

  font-size: 14px;
  height: 44px;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const PromoStar = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="33"
    height="24"
    viewBox="0 0 33 24"
    fill="none">
    <path
      opacity="0.21"
      d="M8.99235 3.83098C8.83648 3.50622 8.50709 3.29956 8.14534 3.29956C7.78359 3.29956 7.45714 3.50622 7.29833 3.83098L5.40725 7.73692L1.18394 8.36281C0.83102 8.41595 0.536917 8.66395 0.4281 9.00347C0.319282 9.34299 0.407512 9.71793 0.66044 9.96888L3.72498 13.0127L3.00149 17.3143C2.94267 17.6686 3.08972 18.0287 3.38088 18.2384C3.67205 18.448 4.05732 18.4746 4.37495 18.3063L8.14828 16.2839L11.9216 18.3063C12.2392 18.4746 12.6245 18.4509 12.9157 18.2384C13.2068 18.0258 13.3539 17.6686 13.2951 17.3143L12.5686 13.0127L15.6332 9.96888C15.8861 9.71793 15.9773 9.34299 15.8655 9.00347C15.7538 8.66395 15.4626 8.41595 15.1097 8.36281L10.8834 7.73692L8.99235 3.83098Z"
      fill="#F07B3F"
    />
    <path
      opacity="0.21"
      d="M25.9924 3.83098C25.8365 3.50622 25.5071 3.29956 25.1453 3.29956C24.7836 3.29956 24.4571 3.50622 24.2983 3.83098L22.4072 7.73692L18.1839 8.36281C17.831 8.41595 17.5369 8.66395 17.4281 9.00347C17.3193 9.34299 17.4075 9.71793 17.6604 9.96888L20.725 13.0127L20.0015 17.3143C19.9427 17.6686 20.0897 18.0287 20.3809 18.2384C20.672 18.448 21.0573 18.4746 21.3749 18.3063L25.1483 16.2839L28.9216 18.3063C29.2392 18.4746 29.6245 18.4509 29.9157 18.2384C30.2068 18.0258 30.3539 17.6686 30.2951 17.3143L29.5686 13.0127L32.6332 9.96888C32.8861 9.71793 32.9773 9.34299 32.8655 9.00347C32.7538 8.66395 32.4626 8.41595 32.1097 8.36281L27.8834 7.73692L25.9924 3.83098Z"
      fill="#F07B3F"
    />
    <path
      d="M18.1615 1.37384C17.9308 0.890816 17.4432 0.583435 16.9077 0.583435C16.3722 0.583435 15.889 0.890816 15.6539 1.37384L12.8545 7.18335L6.60266 8.11428C6.08022 8.19332 5.64486 8.56217 5.48378 9.06716C5.32269 9.57214 5.4533 10.1298 5.82771 10.5031L10.3642 15.0304L9.2932 21.4283C9.20613 21.9552 9.42381 22.4909 9.85482 22.8027C10.2858 23.1145 10.8562 23.154 11.3263 22.9037L16.9121 19.8958L22.4978 22.9037C22.968 23.154 23.5383 23.1189 23.9693 22.8027C24.4003 22.4865 24.618 21.9552 24.5309 21.4283L23.4556 15.0304L27.992 10.5031C28.3665 10.1298 28.5014 9.57214 28.336 9.06716C28.1705 8.56217 27.7395 8.19332 27.2171 8.11428L20.9609 7.18335L18.1615 1.37384Z"
      fill="#F07B3F"
    />
    <path
      d="M18.1547 0.786139C17.9252 0.305758 17.4403 6.10352e-05 16.9077 6.10352e-05C16.3752 6.10352e-05 15.8946 0.305758 15.6607 0.786139L12.8767 6.56381L6.65915 7.48964C6.13957 7.56824 5.7066 7.93508 5.54639 8.4373C5.38619 8.93951 5.51609 9.49413 5.88845 9.86534L10.4001 14.3678L9.33495 20.7307C9.24835 21.2547 9.46484 21.7875 9.89349 22.0976C10.3221 22.4076 10.8893 22.447 11.357 22.198L16.9121 19.2066L22.4671 22.198C22.9348 22.447 23.502 22.412 23.9306 22.0976C24.3593 21.7832 24.5758 21.2547 24.4892 20.7307L23.4197 14.3678L27.9313 9.86534C28.3037 9.49413 28.4379 8.93951 28.2734 8.4373C28.1088 7.93508 27.6802 7.56824 27.1606 7.48964L20.9387 6.56381L18.1547 0.786139Z"
      fill="url(#paint0_linear_45_1804)"
    />
    <path
      d="M20.5584 11.8786C20.5584 13.8972 18.922 15.5335 16.9035 15.5335C14.8849 15.5335 13.2485 13.8972 13.2485 11.8786"
      stroke="white"
      stroke-width="0.987818"
      stroke-linecap="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear_45_1804"
        x1="16.9108"
        y1="6.10352e-05"
        x2="16.9108"
        y2="22.3621"
        gradientUnits="userSpaceOnUse">
        <stop stop-color="#FFAE84" />
        <stop offset="1" stop-color="#F07B3F" />
      </linearGradient>
    </defs>
  </svg>
);

const ReviewRow = () => (
  <Row>
    <ReviewCell>
      <Stars>
        <Star />
        <Star />
        <Star />
        <Star />
        <Star filled={false} />
      </Stars>
      <div>Nice products, love the quality of it</div>
    </ReviewCell>
    <UserCell>
      <FlagUK />
      <span>johnsmith</span>
    </UserCell>
    <DateCell>Apr 23, 2023</DateCell>
  </Row>
);

export function PromoReviewsPro() {
  const handleGetReviews = () => {
    window.open(
      "https://apps.shopify.com/reviewspro?utm_source=alidrop&utm_medium=importList",
      "_blank"
    );
  };

  return (
    <>
      <Page>
        <Header>
          Total Reviews: <span style={{ fontWeight: 700 }}>221</span> /{" "}
          <span style={{ fontWeight: 700 }}>4.9</span>
        </Header>

        <Table>
          <Row>
            <Th>Review</Th>
            <Th>User</Th>
            <Th>Date</Th>
          </Row>

          <ReviewRow />
          <ReviewRow />
          <ReviewRow />
        </Table>
      </Page>

      <Overlay>
        <Modal>
          <Brand>
            <PromoStar />
            <BrandName>ReviewsPro</BrandName>
          </Brand>
          <ModalBody>
            <H1>Don’t Sell Without Proof!</H1>
            <P>
              Your competitors already have reviews. Stand out and win buyers’
              trust, import reviews instantly with just one click.
            </P>
            <CTA onClick={handleGetReviews}>Get Reviews Now</CTA>
          </ModalBody>
        </Modal>
      </Overlay>
    </>
  );
}
