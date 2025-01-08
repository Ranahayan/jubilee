import styled from "styled-components";
import { getColor, getPxSize, getSize, responsive } from "~/helpers/style";


export const Container = styled.div`
  ${responsive("laptop", true)} {
    padding-bottom: ${getPxSize(50)};
  }
`;

export const Content = styled.div`
  background-color: ${getColor("white")};
  border-radius: ${getSize(0.6)};
  margin: ${getPxSize(20)} 0;
  padding: ${getPxSize(20)} ${getPxSize(30)};

  ${responsive("laptop", true)} {
    padding: ${getPxSize(20)};
  }
`;

export const PageTitle = styled.h4`
  font-weight: 600;
  font-size: ${getPxSize(18)};
  line-height: ${getPxSize(20)};
  margin-bottom: ${getPxSize(10)};
`;

export const Hero = styled.section`
  display: flex;
  justify-content: space-between;
  gap: ${getPxSize(50)};
  align-items: center;
  margin-bottom: ${getPxSize(10)};

  ${responsive("laptop", true)} {
    flex-direction: column;
    gap: ${getPxSize(10)};
    text-align: center;
  }
`;

export const HeroText = styled.div`
  flex: 1;
  min-width: ${getPxSize(300)};

  h1 {
    margin: 0;
    font-weight: 700;
    font-size: ${getPxSize(32)};
    line-height: ${getPxSize(43)};
    max-width: ${getPxSize(480)};
    span{
      color: ${getColor("#2233EA")};
    }
  }

  p {
    font-weight: 500;
    font-size: ${getPxSize(14)};
    line-height: ${getPxSize(25)};
  }

  ${responsive("laptop", true)} {
    order: 2;

    h1 {
      font-weight: 700;
      margin: auto;
      font-size: ${getPxSize(24)};
      line-height: ${getPxSize(38)};
    }
  }
`;

export const HeroImage = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  img {
    margin: ${getPxSize(30)} 0;
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  ${responsive("laptop", true)} {
    width: 160px;
    height: 160px;
    padding: 30px;

    img {
      margin: 0 auto;
      border-radius: 50%;
    }
  }
`;

export const Checklist = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;

    &::before {
      content: "";
      background: url("https://alidrop-production-frontend-app.s3.us-east-1.amazonaws.com/assets/check-success.svg") no-repeat center center;
      background-size: contain;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    ${responsive("laptop", true)} {
      justify-content: center;
      text-align: center;
    }
  }

  ${responsive("laptop", true)} {
    padding: 0 1rem;
  }
`;

export const CTAButton = styled.button`
  background-color: #2233ea;
  color: ${getColor("white")};
  padding: 14px 31px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  height: 45px;
  border-radius: 10px;
  margin: 0.35rem 0 1rem;
  width: fit-content;

  ${responsive("laptop", true)} {
    margin-left: auto;
    margin-right: auto;
  }
`;

export const CustomerBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  span {
    color: #444;
    font-weight: 500;
    font-size: 12px;
    line-height: 25px;
  }

  img {
    max-width: 45px;
  }

  ${responsive("laptop", true)} {
    justify-content: center;
    gap: 0.5rem;
  }
`;

export const WhatWeOffer = styled.section`
  margin-top: ${getSize(3)};
`;

export const OfferHeading = styled.h2`
  margin: 1.5rem 0;
  font-weight: 600;
  font-size: 22px;
  line-height: 38px;
  text-align: center;
`;

export const OfferGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;

  ${responsive("laptopL", true)} {
    flex-wrap: nowrap;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding: 1rem;

    &::-webkit-scrollbar {
      display: none;
    }

    & > div {
      scroll-snap-align: start;
    }
  }
`;

export const OfferCard = styled.div`
  flex: 1 1 calc(25% - 1.5rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: #fff;
  padding: 10px 15px;
  border-radius: 12px;
  min-width: 160px;
  min-height: 240px;
  border: 1px solid #f3f1f8;

  ${responsive("laptopL", true)} {
    flex: 0 0 95%;
    max-width: 230px;
  }

  h4 {
    margin: 15px 0 5px;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    font-weight: 400;
    font-size: 12px;
    line-height: 18px;
    letter-spacing: 0;
    color: #717680;
  }
`;

export const IconWrapper = styled.div`
  height: 150px;
  width: 100%;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  padding: 10px 0;
  background: #f9f8fd;
  border-radius: 14.84px;
  
  img{
    width: 100%;
    height: auto;
    object-fit: cover;
  }
`;
