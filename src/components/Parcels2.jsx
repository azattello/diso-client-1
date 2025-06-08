import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';
import { useSelector } from 'react-redux';
import './styles/parcels2.css';
import { getStatus } from "../action/status";
import { FaCheckCircle, FaTimesCircle, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Parcels2 = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [notFoundBookmarks, setNotFoundBookmarks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  const userId = useSelector(state => state.user.currentUser?.id);

  // Общая функция загрузки (с учётом поиска)
  const fetchData = async (search = '') => {
    setLoading(true);
    try {
      const resp = await axios.get(
        `${config.apiUrl}/api/bookmark/bookmarks/${userId}`,
        { params: { page: currentPage, search } }
      );
      setBookmarks(resp.data.updatedBookmarks || []);
      setNotFoundBookmarks(resp.data.notFoundBookmarks || []);
      setTotalPages(resp.data.totalPages || 1);
      setTotalBookmarks(resp.data.totalBookmarks || 0);

      const statusesData = await getStatus();
      setStatuses(statusesData || []);
    } catch (err) {
      console.error('Ошибка при получении данных:', err);
    } finally {
      setLoading(false);
    }
  };

  // Инициируем загрузку при смене страницы
  useEffect(() => {
    if (userId) {
      fetchData(searchTerm);
    }
  }, [userId, currentPage]);

  // Хэндлер поиска
  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(searchTerm);
  };

  const removeBookmark = async (trackNumber) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту закладку?")) return;
    try {
      const res = await fetch(
        `${config.apiUrl}/api/bookmark/${userId}/delete/${trackNumber}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Ошибка при удалении');
      setBookmarks(prev => prev.filter(b => b.trackDetails?.track !== trackNumber));
      setNotFoundBookmarks(prev => prev.filter(b => b.trackNumber !== trackNumber));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Статусы с "Получено" в конце
  const sortedStatuses = [...statuses].sort((a, b) => {
    if (a.statusText === 'Получено') return 1;
    if (b.statusText === 'Получено') return -1;
    return 0;
  });

  return (
    <div className="container">
      {/* Search bar всегда виден */}
      <div className="search-container" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Поиск по описанию или трек-номеру"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
          Искать
        </button>
      </div>

      {loading ? (
        <div className="bookmark-summary">
          <div>Загрузка ...</div>
        </div>
      ) : (
        <>
          <div className="bookmark-summary">
            <p>Показано {bookmarks.length + notFoundBookmarks.length} из {totalBookmarks} посылок</p>
          </div>

          {/* Не найденные закладки */}
          <div className="not-found-list">
            {notFoundBookmarks.map((b, i) => (
              <div className="bookmark-card" key={i}>
                <div className="bookmark-header">
                  <p className="bookmark-h2">{b.trackNumber}</p>
                  <FaTrash onClick={() => removeBookmark(b.trackNumber)} className="removeLiBookmark" />
                </div>
                <div className="statuses-bookmark">
                  <div className="description"><b>{t('menu.about')}:</b> {b.description}</div>
                  <div className="status-item">
                    <FaCheckCircle className="status-icon completed" />
                    <div className="status-text">
                      <p>Дата регистрации клиентом:</p>
                      <span className="date-bookmarks">
                        {b.createdAt ? formatDate(b.createdAt) : 'нет данных'}
                      </span>
                    </div>
                  </div>
                  {sortedStatuses.map((st, idx) => (
                    <div className="status-item" key={idx}>
                      <FaTimesCircle className="status-icon pending" />
                      <div className="status-text">
                        <p>{st.statusText}</p>
                        <span className="date-bookmarks">неизвестно</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Найденные закладки */}
          {bookmarks.length > 0 && (
            <div className="bookmarks-list">
              {bookmarks.map(b => (
                <div className="bookmark-card" key={b._id}>
                  <div className="bookmark-header">
                    <h2 className="bookmark-h2">{b.trackDetails?.track}</h2>
                    <FaTrash onClick={() => removeBookmark(b.trackDetails.track)} className="removeLiBookmark" />
                  </div>
                  <div className="statuses-bookmark">
                    <p className="description">{b.description}</p>
                    <div className="status-item">
                      <FaCheckCircle className="status-icon completed" />
                      <div className="status-text">
                        <p>Дата регистрации клиентом:</p>
                        <span className="date-bookmarks">
                          {b.createdAt ? formatDate(b.createdAt) : 'нет данных'}
                        </span>
                      </div>
                    </div>
                    {sortedStatuses.map((st, idx) => {
                      const hist = b.history?.find(h => h.status.statusText === st.statusText);
                      return (
                        <div className="status-item" key={idx}>
                          {hist ? <FaCheckCircle className="status-icon completed" />
                                : <FaTimesCircle className="status-icon pending" />}
                          <div className="status-text">
                            <p>{st.statusText}</p>
                            <span className="date-bookmarks">
                              {hist ? formatDate(hist.date) : 'нет данных'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Пагинация */}
          <div className="pagination">
            <button onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button">&laquo;</button>
            <span className="pagination-info">
              Страница {currentPage} из {totalPages}
            </span>
            <button onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button">&raquo;</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Parcels2;
