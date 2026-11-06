import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Search, Store } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Select from "../ui/Select";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import CompanyLogo from "../applications/CompanyLogo";
import api from "../../api/axios";
import { EXHIBITOR_CATEGORIES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";

export default function ExhibitorSearch({ expoId }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [exhibitors, setExhibitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      const params = { search: search.trim() || undefined, category: category || undefined };
      api
        .get(`/expos/${expoId}/exhibitors`, { params })
        .then((res) => active && setExhibitors(res.data.exhibitors))
        .catch((error) => active && toast.error(getErrorMessage(error)))
        .finally(() => active && setLoading(false));
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [expoId, search, category]);

  const hasFilters = search.trim() || category;

  return (
    <div className="space-y-5">
      <Card className="p-4!">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr] sm:items-end">
          <div>
            <label htmlFor="exhibitor-search" className="mb-1.5 block text-sm font-medium text-slate-700">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="exhibitor-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Company, product or keyword"
                className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3.5 pl-10 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
              />
            </div>
          </div>
          <Select
            label="Category"
            name="category"
            placeholder="All categories"
            options={EXHIBITOR_CATEGORIES}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600">
          <Spinner />
        </div>
      ) : exhibitors.length === 0 ? (
        <Card>
          <EmptyState
            icon={hasFilters ? Search : Building2}
            title={hasFilters ? "No matching exhibitors" : "No exhibitors yet"}
            message={hasFilters ? "Try another word or category." : "Exhibitors will show here once they are approved."}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {exhibitors.map((exhibitor) => (
            <ExhibitorCard key={exhibitor._id} exhibitor={exhibitor} expoId={expoId} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExhibitorCard({ exhibitor, expoId }) {
  const products = exhibitor.productsServices || [];

  return (
    <Link
      to={`/attendee/exhibitors/${exhibitor.user}?expoId=${expoId}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <CompanyLogo logo={exhibitor.logo} name={exhibitor.companyName} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-indigo-700">{exhibitor.companyName}</h3>
          {exhibitor.category && <p className="mt-0.5 text-sm text-slate-500">{exhibitor.category}</p>}
        </div>
      </div>

      {products.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {products.slice(0, 3).map((product) => (
            <li key={product} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {product}
            </li>
          ))}
          {products.length > 3 && <li className="px-1 text-xs text-slate-500">+{products.length - 3} more</li>}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {exhibitor.booth ? (
          <Badge color="indigo">
            <Store className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Booth {exhibitor.booth.boothNumber}
            {exhibitor.booth.hall && ` · ${exhibitor.booth.hall}`}
          </Badge>
        ) : (
          <span className="text-xs text-slate-400">No booth yet</span>
        )}
        <span className="text-sm font-semibold text-indigo-600">View</span>
      </div>
    </Link>
  );
}
