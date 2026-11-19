import './style.css';
export const metadata={title:'Kitchen · Household food manager',description:'Your kitchen inventory, recipes and meal planning',manifest:'/manifest.webmanifest'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/><body>{children}</body></html>}
