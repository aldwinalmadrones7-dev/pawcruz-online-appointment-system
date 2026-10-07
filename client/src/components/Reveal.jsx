/**
 * Reveal — Fades and slides its children in the first time they scroll into view.
 * (Disabled automatically for visitors who prefer reduced motion — see global.css.)
 */
import useInView from '../hooks/useInView';

export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children }) {
  const [ref, inView] = useInView();
  return (
    <Tag ref={ref} className={`reveal${inView ? ' is-visible' : ''} ${className}`.trim()} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}
