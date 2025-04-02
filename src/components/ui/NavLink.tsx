
import React from "react";
import { Link, useMatch, useResolvedPath } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  end?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  to,
  children,
  className = "",
  activeClassName = "",
  inactiveClassName = "",
  end = false,
  ...props
}) => {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end });

  return (
    <Link
      to={to}
      className={cn(
        "nav-link",
        className,
        match ? "active " + activeClassName : inactiveClassName
      )}
      {...props}
    >
      {children}
    </Link>
  );
};

export default NavLink;
