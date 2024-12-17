import { ReactNode } from 'react';
import useUserRole from '~/lib/user/hooks/use-userRole';
// import useUserRole from '~/hooks/useUserRole';

interface RoleControlledComponentProps {
  children: ReactNode;
  hideFor?: string[]; // Roles for which the component should be hidden
  showOnlyFor?: string[]; // Roles for which the component is visible
}

/**
 * @description A wrapper component that conditionally renders children
 * based on the user's role.
 */
const RoleControlledComponent = ({
  children,
  hideFor = [],
  showOnlyFor = [],
}: RoleControlledComponentProps) => {
  const { data: role } = useUserRole();

  // If no role is available, don't show anything
  if (!role) return null;

  // Hide content if the current role is in the hideFor list
  if (hideFor.length > 0 && hideFor.includes(role)) {
    return null;
  }

  // Show content only for specified roles
  if (showOnlyFor.length > 0 && !showOnlyFor.includes(role)) {
    return null;
  }

  // Render children if none of the conditions apply
  return <>{children}</>;
};

export default RoleControlledComponent;
