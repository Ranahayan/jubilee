import { useEffect } from "react";

export const useUTM = () => {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const utmCampaign = searchParams.get("utm_campaign");
    const utmCampaignid = searchParams.get("utm_campaignid");
    const utmSource = searchParams.get("utm_source");
    const utmMedium = searchParams.get("utm_medium");
    const utmTerm = searchParams.get("utm_term");
    const utmContent = searchParams.get("utm_content");
    const utmMediumVariant = searchParams.get("utm_medium_variant");
    const utmDevice = searchParams.get("utm_device");
    const utmNetwork = searchParams.get("utm_network");
    const utmPlacement = searchParams.get("utm_placement");
    const utmLocPhysical = searchParams.get("utm_loc_physical");
    const utmAdgroup = searchParams.get("utm_adgroup");
    const utmAssetgroupid = searchParams.get("utm_assetgroupid");
    const utmCreative = searchParams.get("utm_creative");
    const utmKeyword = searchParams.get("utm_keyword");
    const utmKeywordid = searchParams.get("utm_keywordid");
    const utmSearchterm = searchParams.get("utm_searchterm");
    const utmMatchtype = searchParams.get("utm_matchtype");
    const utmLocation = searchParams.get("utm_location");
    const utmSitelink = searchParams.get("utm_sitelink");
    
    if (
      !utmCampaign 
      && !utmCampaignid
      && !utmSource 
      && !utmMedium 
      && !utmTerm 
      && !utmContent
      && !utmMediumVariant
      && !utmDevice
      && !utmNetwork
      && !utmPlacement
      && !utmLocPhysical
      && !utmAdgroup
      && !utmAssetgroupid
      && !utmCreative
      && !utmKeyword
      && !utmKeywordid
      && !utmSearchterm
      && !utmMatchtype
      && !utmLocation
      && !utmSitelink
    ) return;

    localStorage.setItem("utm_campaign", utmCampaign || "");
    localStorage.setItem("utm_campaignid", utmCampaignid || "");
    localStorage.setItem("utm_source", utmSource || "");
    localStorage.setItem("utm_medium", utmMedium || "");
    localStorage.setItem("utm_term", utmTerm || "");
    localStorage.setItem("utm_content", utmContent || "");
    localStorage.setItem("utm_medium_variant", utmMediumVariant || "");
    localStorage.setItem("utm_device", utmDevice || "");
    localStorage.setItem("utm_network", utmNetwork || "");
    localStorage.setItem("utm_placement", utmPlacement || "");
    localStorage.setItem("utm_loc_physical", utmLocPhysical || "");
    localStorage.setItem("utm_adgroup", utmAdgroup || "");
    localStorage.setItem("utm_assetgroupid", utmAssetgroupid || "");
    localStorage.setItem("utm_creative", utmCreative || "");
    localStorage.setItem("utm_keyword", utmKeyword || "");
    localStorage.setItem("utm_keywordid", utmKeywordid || "");
    localStorage.setItem("utm_searchterm", utmSearchterm || "");
    localStorage.setItem("utm_matchtype", utmMatchtype || "");
    localStorage.setItem("utm_location", utmLocation || "");
    localStorage.setItem("utm_sitelink", utmSitelink || "");
  }, []);

  const getUTM = (key: string) => {
    const value = localStorage.getItem(key);
    if (!value) return null;
    return value;
  };

  return {
    campaign: getUTM("utm_campaign"),
    campaignid: getUTM("utm_campaignid"),
    source: getUTM("utm_source"),
    medium: getUTM("utm_medium"),
    term: getUTM("utm_term"),
    content: getUTM("utm_content"),
    medium_variant: getUTM("utm_medium_variant"),
    device: getUTM("utm_device"),
    network: getUTM("utm_network"),
    placement: getUTM("utm_placement"),
    loc_physical: getUTM("utm_loc_physical"),
    adgroup: getUTM("utm_adgroup"),
    assetgroupid: getUTM("utm_assetgroupid"),
    creative: getUTM("utm_creative"),
    keyword: getUTM("utm_keyword"),
    keywordid: getUTM("utm_keywordid"),
    searchterm: getUTM("utm_searchterm"),
    matchtype: getUTM("utm_matchtype"),
    location: getUTM("utm_location"),
    sitelink: getUTM("utm_sitelink"),
  };
};
