import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { captureInfluencerRefFromSearch } from '../../utils/influencerCode'

/** Her rotada ?ref= / ?indirim= kodunu sessionStorage’a yazar (landing dahil). */
export default function InfluencerRefCapture() {
  const { search } = useLocation()
  useEffect(() => {
    captureInfluencerRefFromSearch(search)
  }, [search])
  return null
}
