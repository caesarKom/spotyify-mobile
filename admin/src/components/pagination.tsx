interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}:PaginationProps) => {
  // liczba widocznych „kółek” obok aktualnej
  const delta = 2;
  const left = Math.max(1, currentPage - delta);
  const right = Math.min(totalPages, currentPage + delta);

  const pages: (number | string)[] = [];
  if (left > 1) pages.push(1);
  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push('...');
  if (right < totalPages) pages.push(totalPages);

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {/* Previous */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 hover:bg-gray-50"
      >
        Previous
      </button>

      {/* Numeryki + skok do konkretnej */}
      {pages.map((p, idx) =>
        typeof p === 'number' ? (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-2 border rounded-lg ${
              p === currentPage
                ? 'bg-purple-600 text-white'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ) : (
          <span key={`dots-${idx}`} className="px-2 text-gray-400">
            ...
          </span>
        )
      )}

      {/* Next */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 hover:bg-gray-50"
      >
        Next
      </button>

      {/* Skok do konkretnej strony – input */}
      <div className="flex items-center gap-2 ml-4">
        <span className="text-sm text-gray-600">Go to:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          defaultValue={currentPage}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const page = Math.max(1, Math.min(totalPages, parseInt(e.currentTarget.value) || 1));
              onPageChange(page);
              e.currentTarget.value = String(page); // reset jeśli użytkownik wpisał za dużo
            }
          }}
          className="w-20 px-2 py-1 border rounded text-center"
        />
      </div>
    </div>
  );
};

export default Pagination;