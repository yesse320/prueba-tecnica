'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SupabaseExample() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ejemplo: Reemplaza 'tu_tabla' con el nombre de tu tabla
        const { data, error } = await supabase
          .from('tu_tabla')
          .select('*')
          .limit(10)

        if (error) throw error
        setData(data || [])
      } catch (err: any) {
        setError(err.message)
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-4">Cargando...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Datos de Supabase</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No hay datos disponibles</p>
      ) : (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="p-2 border rounded bg-gray-100">
              <pre>{JSON.stringify(item, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
