import { EDITORIAL_QUEUE } from '../content/editorial-roadmap'

export default function EditorialQueue() {
  return (
    <div className="blog-soon" data-rise>
      <div className="blog-soon-head">
        <span className="blog-soon-fig">03 · in the pipeline</span>
        <span className="blog-soon-count">{EDITORIAL_QUEUE.length} evidence-gated</span>
      </div>
      <div className="blog-soon-grid">
        {EDITORIAL_QUEUE.map((post) => (
          <div key={post.slug} className="blog-soon-tile">
            <p className="blog-soon-meta">
              <span className="blog-soon-tag">{post.tag}</span>
              <span aria-hidden>·</span>
              <span>{post.date}</span>
            </p>
            <p className="blog-soon-title">{post.title}</p>
            <p className="blog-soon-teaser">{post.teaser}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
