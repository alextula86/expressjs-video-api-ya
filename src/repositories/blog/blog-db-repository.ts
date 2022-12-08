import { trim } from 'lodash'
import { blogCollection, postCollection } from '../../repositories/db'

import { getNextStrId } from '../../utils'
import { RepositoryBlogType, BlogType, PostType, SortDirection  } from '../../types'

export const blogRepository: RepositoryBlogType = {
  async findAllBlogs({
    searchNameTerm = null,
    pageNumber = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortDirection =  SortDirection.DESC,
  }) {
    const filter: any = {}
    const sort: any = { [sortBy]: sortDirection === SortDirection.ASC ? 1 : -1 }
    
    if (searchNameTerm) {
      filter.name = { $regex: searchNameTerm }
    }

    const totalCount = await blogCollection.count(filter)
    console.log('totalCount', totalCount)
    const pagesCount = Math.ceil(totalCount / pageSize)
    const skip = (+pageNumber - 1) * +pageSize

    const blogs: BlogType[] = await blogCollection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(+pageSize)
      .toArray()

    return this._getBlogsViewModelDetail({
      items: blogs,
      totalCount: totalCount + 1,
      pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
    })
  },
  async findBlogById(id) {
    const foundBlog: BlogType | null = await blogCollection.findOne({ id })

    if (!foundBlog) {
      return null
    }

    return this._getBlogViewModel(foundBlog)
  },
  async findPostsByBlogId(blogId, {
    searchNameTerm = null,
    pageNumber = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortDirection =  SortDirection.DESC,
  }) {
    const filter: any = { blogId: { $eq: blogId } }
    const sort: any = { [sortBy]: sortDirection === SortDirection.ASC ? 1 : -1 }

    if (searchNameTerm) {
      filter.title = { $regex: searchNameTerm }
    }

    const totalCount = await postCollection.count(filter)
    const pagesCount = Math.ceil(totalCount / pageSize)
    const skip = (+pageNumber - 1) * +pageSize

    const posts: PostType[] = await postCollection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(+pageSize)
      .toArray()

    return this._getPostsViewModelDetail({
      items: posts,
      totalCount,
      pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
    })
  },
  async createdBlog({ name, description, websiteUrl }) {
    const createdBlog: BlogType = {
      id: getNextStrId(),
      name: trim(String(name)),
      description: trim(String(description)),
      websiteUrl: trim(String(websiteUrl)),
      createdAt: new Date().toISOString()
    }

    await blogCollection.insertOne(createdBlog)

    return this._getBlogViewModel(createdBlog)
  },
  async createdPostByBlogId({ title, shortDescription, content, blogId, blogName }) {
    const createdPost: PostType = {
      id: getNextStrId(),
      title: trim(String(title)),
      shortDescription: trim(String(shortDescription)),
      content: trim(String(content)),
      blogId,
      blogName,
      createdAt: new Date().toISOString(),
    }

    await postCollection.insertOne(createdPost)

    return this._getPostViewModel(createdPost)
  },
  async updateBlog({id, name, description, websiteUrl }) {      
    const { matchedCount } = await blogCollection.updateOne({ id }, {
      $set: {
        name: trim(String(name)),
        description: trim(String(description)),
        websiteUrl: trim(String(websiteUrl)),
      }
    })

    return matchedCount === 1    
  },
  async deleteBlogById(id) {
    const { deletedCount } = await blogCollection.deleteOne({ id })

    return deletedCount === 1
  },
  _getBlogViewModel(dbBlog) {    
    return {
      id: dbBlog.id,
      name: dbBlog.name,
      description: dbBlog.description,
      websiteUrl: dbBlog.websiteUrl,
      createdAt: dbBlog.createdAt,
    }
  },
  _getPostViewModel(dbPost) {
    return {
      id: dbPost.id,
      title: dbPost.title,
      shortDescription: dbPost.shortDescription,
      content: dbPost.content,
      blogId: dbPost.blogId,
      blogName: dbPost.blogName,
      createdAt: dbPost.createdAt,
    }
  },
  _getBlogsViewModelDetail({ items, totalCount, pagesCount, page, pageSize }) {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        websiteUrl: item.websiteUrl,
        createdAt: item.createdAt,
      })),
    }
  },
  _getPostsViewModelDetail({ items, totalCount, pagesCount, page, pageSize }) {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        shortDescription: item.shortDescription,
        content: item.content,
        blogId: item.blogId,
        blogName: item.blogName,
        createdAt: item.createdAt,
      })),
    }
  },  
}
