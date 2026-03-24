import { memo } from "react";

const mem = (content: string, path: string) => content;

export default mem(`# WarungSync - POS & E-commerce for small food shops

## Design System
- Primary: HSL 122 39% 49% (green #4CAF50)
- Secondary: HSL 210 29% 24% (dark blue #2C3E50)
- Background: HSL 210 17% 98% (light gray #F8F9FA)
- Accent: HSL 36 100% 50% (orange #FF9800)
- Font: Inter
- All colors via semantic tokens in index.css

## Architecture
- localStorage-based data store (src/lib/store.ts)
- Types in src/types/index.ts
- Admin pages under src/pages/admin/
- Store (customer) pages under src/pages/store/
- No backend yet - ready for Lovable Cloud integration

## Key Routes
- / - Landing page
- /admin - Admin dashboard with sidebar layout
- /admin/pos - POS/Cashier system
- /admin/products - Product CRUD
- /admin/inventory - Stock management
- /admin/orders - Order management
- /admin/reports - Sales reports
- /admin/settings - Delivery toggle
- /store - Customer storefront
- /store/cart - Shopping cart
- /store/checkout - Checkout flow
- /store/orders - Order tracking
`, "mem://index.md");
