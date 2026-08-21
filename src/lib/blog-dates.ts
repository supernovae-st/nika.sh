import type { BlogPost } from '../content/blog.generated'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type BlogDate = Pick<BlogPost, 'date' | 'published'>

export const publicationDate = (post: BlogDate) => post.published ?? post.date

export const storyDateLabel = (post: BlogDate) => {
  const [year, month, day] = post.date.split('-')
  if (day) return post.date
  return `${MONTHS[Number(month) - 1]} ${year}`
}

export const isRetrospective = (post: BlogDate) => Boolean(post.published)
