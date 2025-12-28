import { apiRequest } from "../config/api"

export const getAllMusic = async (
  page = 1,
  limit = 20,
  search = "",
  genre = "",
  artist = ""
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(genre && { genre }),
    ...(artist && { artist }),
  })

  const res = await apiRequest(`/music?${params.toString()}`)
  return res.json()
}
