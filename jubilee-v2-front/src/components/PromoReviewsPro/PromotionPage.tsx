import styled, { createGlobalStyle } from "styled-components";

import aliexpress from "./aliexpress-bag-icon.png";
import amazonIcon from "./amazon-icon.png";
import ebayIcon from "./ebay-icon.png";
import temuIcon from "./temu-icon.png";
import { SPOCKET_APP_ASSETS_BUCKET_URL } from "~/constants/urls";

const mockupImage = `${SPOCKET_APP_ASSETS_BUCKET_URL}/background-promo-reviews.avif`;

const GlobalStyle = createGlobalStyle`
  :root{
    --bg: #f6f7fb;
    --surface: #ffffff;
    --text: #0f1726;
    --muted: #6b7280;
    --primary: #F3451F; /* accent used for CTA and highlight */
    --primary-600: #060505ff;
    --ring: rgba(17, 24, 39, .08);
    --card-border: #e5e7eb;
  }
  *, *::before, *::after{ box-sizing: border-box; }
  body{ margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; color: var(--text); background: var(--bg); }
`;

const Page = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  padding: 0px 0px 0px;
  max-width: 1200px;
  margin: 0 auto;

  @media (min-width: 980px) {
    grid-template-columns: 1.05fr 1fr; /* Hero text + visual */
    align-items: center;
    gap: 56px;
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column-reverse;
    padding-inline: 12px;
  }
`;

const HeroCopy = styled.section`
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

const Eyebrow = styled.span`
  display: inline-block;
  font-weight: 600;
  color: var(--primary);
  background: rgba(255, 98, 54, 0.12);
  border: 1px solid rgba(255, 98, 54, 0.25);
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.3px;
  margin-bottom: 16px;
`;

const H1 = styled.h1`
  font-size: 38px;
  line-height: 130%;
  margin: 0 0 14px;
  font-weight: 800;
  letter-spacing: -0.02em;

  .accent {
    color: var(--primary);
  }
`;

const Sub = styled.p`
  margin: 0 0 18px;
  font-size: 16px;
  line-height: 1.6;
  color: var(--muted);
  max-width: 54ch;
`;

const Bullets = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0 28px;
  display: grid;
  gap: 10px;
`;

const Bullet = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-weight: 500;
  svg {
    flex: 0 0 18px;
  }
`;

const CTA = styled.button`
  appearance: none;
  border: none;
  cursor: pointer;
  background: var(--primary);
  color: #fff;
  font-weight: 700;
  padding: 14px 18px;
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(255, 98, 54, 0.25);

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const VisualWrap = styled.section`
  position: relative;
  width: 100%;
  height: 100%;
  img {
    width: 570px;
    height: auto;
    object-fit: contain;

    @media (max-width: 768px) {
      width: 270px;
    }
  }
`;

const GridBlock = styled.section`
  margin: 8px auto 0;
  margin-bottom: 24px;
`;

const GridTitle = styled.h2`
  font-size: clamp(22px, 2.8vw, 28px);
  text-align: center;
  margin: 42px 0 26px;
`;

const Features = styled.div`
  display: grid;
  gap: 18px;
  padding-inline: 0px;
  grid-template-columns: 1fr;

  @media (min-width: 820px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 768px) {
    margin-bottom: 132px;
    padding-inline: 12px;
  }
`;

const FeatureCard = styled.article`
  background: var(--surface);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 22px 18px;
  box-shadow: 0 10px 22px var(--ring);
  display: grid;
  gap: 10px;
  align-content: start;
`;

const Small = styled.p`
  margin: 0;
  font-size: 12px;
  color: var(--muted);
  text-align: center;
`;

const LinkRow = styled.div`
  margin: 10px auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  a {
    color: var(--primary);
    text-decoration: none;

    :hover {
      color: var(--primary);
    }
    :active {
      color: var(--primary);
    }
  }

  svg {
    opacity: 0.4;
  }
`;

const IconCircle = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  background: #f3f4ff;
  border: 1px solid #e5e7ff;
`;

const CheckIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#10b981"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowIcon = () => (
  <svg
    width="19"
    height="11"
    viewBox="0 0 19 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.6329 0.609457C13.5721 0.674783 13.5238 0.7525 13.4908 0.838124C13.458 0.923747 13.441 1.01559 13.441 1.10835C13.441 1.20112 13.458 1.29296 13.4908 1.37858C13.5238 1.46421 13.5721 1.54192 13.6329 1.60725L16.6165 4.83951H1.34808C1.17605 4.83951 1.01108 4.91354 0.889439 5.04531C0.767804 5.17709 0.699463 5.35584 0.699463 5.5422C0.699463 5.72856 0.767804 5.90725 0.889439 6.03903C1.01108 6.17082 1.17605 6.24488 1.34808 6.24488H16.6035L13.6329 9.45603C13.512 9.58767 13.4442 9.76579 13.4442 9.95144C13.4442 10.137 13.512 10.3151 13.6329 10.4468C13.7543 10.5776 13.9188 10.6511 14.0901 10.6511C14.2615 10.6511 14.4259 10.5776 14.5474 10.4468L18.6726 5.9778C18.7281 5.92014 18.7723 5.85081 18.8024 5.77418C18.8327 5.69747 18.8482 5.61496 18.8482 5.53167C18.8482 5.4483 18.8327 5.36579 18.8024 5.28909C18.7723 5.21243 18.7281 5.14315 18.6726 5.08544L14.5538 0.609457C14.4936 0.543601 14.4219 0.491325 14.3428 0.45565C14.2638 0.419982 14.179 0.401611 14.0934 0.401611C14.0077 0.401611 13.9229 0.419982 13.8439 0.45565C13.7649 0.491325 13.6932 0.543601 13.6329 0.609457Z"
      fill="#223144"
    />
  </svg>
);

const URL =
  "https://apps.shopify.com/reviewspro/?utm_source=jubilee&utm_medium=importReviewsPage";

const ReviewsPromotionPage = () => {
  const handleGetReviews = () => {
    window.open(URL, "_blank");
  };

  return (
    <>
      <GlobalStyle />
      <Page>
        <HeroCopy>
          <Eyebrow>Automated review requests</Eyebrow>
          <H1>
            Build More Trust
            <br />
            For Your Customers
            <br />
            With <span className="accent">Best Reviews</span>
          </H1>
          <Sub>
            Turn your top customer feedback into powerful selling points.
            Highlight standout reviews in eye‑catching carousels or featured
            sections to build trust, inspire shoppers, and boost conversions.
          </Sub>

          <Bullets>
            <Bullet>
              <CheckIcon /> Automated review requests
            </Bullet>
          </Bullets>

          <CTA onClick={handleGetReviews}>Import Reviews for Free</CTA>
        </HeroCopy>

        <VisualWrap>
          <img src={mockupImage} alt="Background showing the app reviews" />
        </VisualWrap>
      </Page>

      <GridBlock>
        <GridTitle>What ReviewsPro Offers?</GridTitle>
        <Features>
          {[
            {
              title: "AliExpress Import",
              image: aliexpress,
              body: "Easily import reviews from AliExpress products.",
            },
            {
              title: "Amazon Import",
              image: amazonIcon,
              body: "Effortlessly import reviews from Amazon products.",
            },
            {
              title: "Ebay Import",
              image: ebayIcon,
              body: "Seamlessly import reviews from eBay products.",
            },
            {
              title: "Temu Import",
              image: temuIcon,
              body: "Quickly import reviews from Temu products.",
            },
          ].map((f, i) => (
            <FeatureCard key={i}>
              <IconCircle>
                <img
                  src={f.image}
                  alt={`${f.title} icon`}
                  style={{ width: 32, height: 32 }}
                />
              </IconCircle>
              <h3 style={{ margin: "10px auto 2px" }}>{f.title}</h3>
              <Small>{f.body}</Small>

              <LinkRow>
                <a href={URL} target="_blank">
                  Get started
                </a>
                <ArrowIcon />
              </LinkRow>
            </FeatureCard>
          ))}
        </Features>
      </GridBlock>
    </>
  );
};

export default ReviewsPromotionPage;
