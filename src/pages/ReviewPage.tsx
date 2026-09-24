import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStaticData } from '../data/load';
import { HindsightForm } from '../flow/HindsightForm';
import { t } from '../i18n';

/** Nhìn lại một bản ghi đã qua. Tùy chọn — mở từ trang chủ hoặc trang tóm tắt. */
export function ReviewPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data } = useStaticData();
  const record = useLiveQuery(() => db.positionings.get(id), [id]);

  if (record === undefined || !data) return <p className="muted">{t('common.loading')}</p>;
  if (!record) return <p>{t('record.notFound')}</p>;
  if (record.hindsight)
    return (
      <p>
        {t('record.hindsight')}: <Link to={`/record/${record.id}`}>{t('home.action.view')}</Link>
      </p>
    );
  return <HindsightForm record={record} data={data} onSaved={() => navigate(`/record/${record.id}`)} />;
}
