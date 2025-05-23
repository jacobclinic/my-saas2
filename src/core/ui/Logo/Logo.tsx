import Link from 'next/link';
import LogoImage from './LogoImage';
import Image from 'next/image';

const Logo: React.FCC<{
  href?: string;
  className?: string;
  label?: string;
}> = ({ href, label, className }) => {
  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <Image
        src={`/assets/images/comaaas.png`}
        alt="Logo"
        width={100}
        height={100}
        className="lg:block" />
    </Link>
  );
};

export default Logo;
