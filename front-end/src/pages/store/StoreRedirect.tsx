import { Navigate } from "react-router-dom";

/** Legacy /store path → multi-tenant store picker */
const StoreRedirect = () => <Navigate to="/stores" replace />;

export default StoreRedirect;
