import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listServicos,
  createServico,
  updateServico,
  deleteServico,
} from '../../lib/servicos'

const emptyForm = { nome_pt: '', nome_ja: '', duracao_minutos: '', preco: '' }

function ServicosManager() {
  const { t } = useTranslation()
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  async function reload() {
    setLoading(true)
    try {
      setServicos(await listServicos())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      nome_pt: form.nome_pt.trim(),
      nome_ja: form.nome_ja.trim(),
      duracao_minutos: Number(form.duracao_minutos),
      preco: Number(form.preco),
    }
    try {
      if (editingId) {
        await updateServico(editingId, payload)
      } else {
        await createServico(payload)
      }
      setForm(emptyForm)
      setEditingId(null)
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleEdit(servico) {
    setEditingId(servico.id)
    setForm({
      nome_pt: servico.nome_pt || servico.nome || '',
      nome_ja: servico.nome_ja || servico.nome || '',
      duracao_minutos: String(servico.duracao_minutos),
      preco: String(servico.preco),
    })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleDelete(id) {
    try {
      await deleteServico(id)
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="servicos-manager">
      <h2>{t('servicos.titulo')}</h2>
      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit} className="form-servico">
        <input
          type="text"
          placeholder={t('servicos.placeholderNomePt')}
          value={form.nome_pt}
          onChange={(e) => setForm({ ...form, nome_pt: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder={t('servicos.placeholderNomeJa')}
          value={form.nome_ja}
          onChange={(e) => setForm({ ...form, nome_ja: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder={t('servicos.placeholderDuracao')}
          value={form.duracao_minutos}
          onChange={(e) => setForm({ ...form, duracao_minutos: e.target.value })}
          required
          min="1"
        />
        <input
          type="number"
          placeholder={t('servicos.placeholderPreco')}
          value={form.preco}
          onChange={(e) => setForm({ ...form, preco: e.target.value })}
          required
          min="0"
          step="1"
        />
        <div className="form-servico-acoes">
          <button type="submit">{editingId ? t('common.save') : t('common.add')}</button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit}>
              {t('common.cancelButton')}
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>{t('servicos.loading')}</p>
      ) : (
        <ul className="lista-servicos">
          {servicos.map((servico) => (
            <li key={servico.id}>
              <div className="lista-servicos-info">
                <span>{servico.nome_pt}</span>
                <span lang="ja">{servico.nome_ja}</span>
                <span>{t('common.minutes', { count: servico.duracao_minutos })}</span>
                <span>¥{servico.preco}</span>
              </div>
              <div className="lista-servicos-acoes">
                <button type="button" onClick={() => handleEdit(servico)}>
                  {t('common.edit')}
                </button>
                <button type="button" onClick={() => handleDelete(servico.id)}>
                  {t('common.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ServicosManager
