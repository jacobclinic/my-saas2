import type UserSession from '~/core/session/types/user-session';
import { Avatar, AvatarFallback, AvatarImage } from '~/core/ui/Avatar';

type ProfileAvatarProps =
  | {
      user: Maybe<UserSession>;
    }
  | {
      text: Maybe<string>;
    };

const ProfileAvatar: React.FCC<ProfileAvatarProps> = (props) => {
  const avatarClassName = 'mx-auto w-9 h-9 group-focus:ring-2';

  if ('user' in props && props.user) {
    const photoUrl = props.user.data?.photoUrl;
    const initials = getDisplayName(props.user)[0];

    return (
      <Avatar className={avatarClassName}>
        <AvatarImage
          src={photoUrl ?? ''}
          alt="Profile avatar"
          onError={(e) => {
            // If image fails to load, hide it to show fallback
            e.currentTarget.style.display = 'none';
          }}
        />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    );
  }

  if ('text' in props && props.text) {
    return (
      <Avatar className={avatarClassName}>
        <AvatarFallback>{props.text[0]}</AvatarFallback>
      </Avatar>
    );
  }

  return null;
};

function getUserInitials(session: Maybe<UserSession>) {
  const displayName = getDisplayName(session);

  return displayName[0] ?? '';
}

function getDisplayName(session: Maybe<UserSession>) {
  if (!session) {
    return '';
  }

  return (
    session.data?.displayName ??
    session.auth?.user.email ??
    session.auth?.user.phone ??
    ''
  );
}

export default ProfileAvatar;
