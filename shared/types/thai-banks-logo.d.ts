declare module "thai-banks-logo/dist/index.js" {
  export type ThaiBankLogoEntry = {
    name: string;
    nameLong: string;
    nameEN: string;
    symbol: string;
    icon: string;
  };

  const bankLists: Record<string, ThaiBankLogoEntry>;
  export default bankLists;
}
