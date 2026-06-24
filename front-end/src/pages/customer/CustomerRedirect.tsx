import { Navigate } from "react-router-dom";

/** Legacy /store path → multi-tenant store picker */
const CustomerRedirect = () => <Navigate to="/customer/stores" replace />;

export default CustomerRedirect;