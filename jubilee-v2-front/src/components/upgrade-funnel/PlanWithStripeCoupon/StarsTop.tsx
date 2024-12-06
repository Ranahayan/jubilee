import * as S from "./styles";

export const StarsTop = () => {
  return (
    <S.StarsSvg
      xmlns="http://www.w3.org/2000/svg"
      width="155"
      height="77"
      fill="none"
      top={0.1}
      right={0.1}>
      <path
        fill="#3751FF"
        fillOpacity=".3"
        d="M13.974 34.034a1 1 0 0 0-1.755.034L9.527 39.23a1 1 0 0 1-.39.406l-5.05 2.891a1 1 0 0 0 .033 1.755l5.16 2.692a1 1 0 0 1 .405.39l2.894 5.055a1 1 0 0 0 1.755-.034l2.695-5.164a1 1 0 0 1 .39-.405l5.048-2.892a1 1 0 0 0-.034-1.754l-5.16-2.693a1 1 0 0 1-.405-.39l-2.894-5.053ZM85.016-2.34a1 1 0 0 0-1.754.035L80.57 2.857a1 1 0 0 1-.39.405l-5.05 2.892a1 1 0 0 0 .033 1.754l5.16 2.693a1 1 0 0 1 .405.39l2.894 5.054a1 1 0 0 0 1.754-.034l2.696-5.163a1 1 0 0 1 .39-.405L93.51 7.55a1 1 0 0 0-.034-1.754l-5.16-2.694a1 1 0 0 1-.405-.39l-2.895-5.053Z"
      />
      <path
        stroke="url(#a)"
        strokeLinecap="round"
        strokeOpacity=".3"
        strokeWidth="3"
        d="M95.621 75.395 155 19.196"
      />
      <defs>
        <linearGradient
          id="a"
          x1="155"
          x2="117.463"
          y1="19.196"
          y2="59.477"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="#3751FF" />
          <stop offset="1" stopColor="#3751FF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </S.StarsSvg>
  );
};
