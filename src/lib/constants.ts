// Priset för 6-månaders premium i orderflödet (öre). En enda källa för både
// klientens visning (order-view) och Stripe-raden (api/stripe/checkout) så att
// UI och debitering aldrig kan glida isär.
//
// Jämförpriset (för det överstrukna "ordinarie pris") räknas INTE som en egen
// konstant här — enligt svensk prismärkningslag (2 kap. 1 § lag 2021:1110) får
// bara ett pris som faktiskt tillämpats visas som jämförpris. Det ska alltid
// härledas som 6 × det verkliga månadspriset (premiumMonthlyOre), se order-view.tsx.
export const PREMIUM_6MO_PRICE_ORE = 29900;

export const VARIANT_IDS = {
  // Här väljer vi "Classic Black" (199 kr) som standardvalet för kortet
  // ID taget från din bild image_a62f37.png (gulmarkerad rad i mitten)
  STANDARD: "cmjbmtftt00076vxtqx2sf74i", 
  
  // Här tar vi din gamla kods ID som gav 699 kr ("Matte Black")
  // ID taget från din bild image_a62f37.png (andra raden uppifrån)
  BUNDLE: "cmjbmtf4a00036vxtmme5ao1x"
};