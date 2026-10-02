import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ArticleBlock } from '@/lib/articles';

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2];
      return href.startsWith('/')
        ? <Link key={index} href={href}>{link[1]}</Link>
        : <a key={index} href={href} target="_blank" rel="noreferrer">{link[1]}</a>;
    }
    return part;
  });
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2>{block.text}</h2>;
    case 'p':
      return <p>{renderInline(block.text)}</p>;
    case 'ul':
      return <ul>{block.items.map((item) => <li key={item}>{renderInline(item)}</li>)}</ul>;
    case 'img':
      return <figure className="guide-figure"><img src={block.src} alt={block.alt} loading="lazy" /></figure>;
    case 'cta':
      return <p className="guide-cta"><Link className="btn btn--primary" href={block.href}>{block.label}</Link></p>;
  }
}

export default function GuideContent({ blocks }: { blocks: ArticleBlock[] }) {
  return <>{blocks.map((block, index) => <Block key={index} block={block} />)}</>;
}