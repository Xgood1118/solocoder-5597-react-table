import React, { useState, useEffect, useMemo } from 'react';
import { HighPerformanceTable } from './components/HighPerformanceTable';
import { ColumnDef } from './types/table';
import { Employee, generateMockData } from './utils/mockData';
import { format } from 'date-fns';

function App() {
  const [dataCount, setDataCount] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<Employee[]>([]);
  const [showPerf, setShowPerf] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const data = generateMockData(dataCount);
      setRawData(data);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [dataCount]);

  const columns: ColumnDef<Employee>[] = useMemo(() => [
    {
      id: 'employeeNo',
      title: '工号',
      width: 120,
      minWidth: 100,
      dataType: 'string',
      sortable: true,
      filterable: true,
      fixed: 'left',
    },
    {
      id: 'name',
      title: '姓名',
      width: 100,
      minWidth: 80,
      dataType: 'string',
      sortable: true,
      filterable: true,
      fixed: 'left',
    },
    {
      id: 'age',
      title: '年龄',
      width: 80,
      minWidth: 60,
      dataType: 'number',
      sortable: true,
      filterable: true,
    },
    {
      id: 'gender',
      title: '性别',
      width: 80,
      minWidth: 60,
      dataType: 'enum',
      sortable: true,
      filterable: true,
      enumValues: ['男', '女'],
    },
    {
      id: 'department',
      title: '部门',
      width: 140,
      minWidth: 100,
      dataType: 'enum',
      sortable: true,
      filterable: true,
      enumValues: ['研发部', '产品部', '设计部', '市场部', '销售部', '运营部', '人力资源部', '财务部', '法务部', '行政部'],
    },
    {
      id: 'position',
      title: '职位',
      width: 120,
      minWidth: 100,
      dataType: 'enum',
      sortable: true,
      filterable: true,
      enumValues: ['工程师', '高级工程师', '技术专家', '架构师', '经理', '总监', '副总裁', '主管', '专员', '助理'],
    },
    {
      id: 'level',
      title: '职级',
      width: 80,
      minWidth: 60,
      dataType: 'enum',
      sortable: true,
      filterable: true,
      enumValues: ['P5', 'P6', 'P7', 'P8', 'P9', 'M1', 'M2', 'M3'],
    },
    {
      id: 'salary',
      title: '薪资',
      width: 120,
      minWidth: 100,
      dataType: 'number',
      sortable: true,
      filterable: true,
      render: (row) => (
        <span className="font-medium text-emerald-600">
          ¥{row.salary.toLocaleString()}
        </span>
      ),
    },
    {
      id: 'performance',
      title: '绩效分',
      width: 100,
      minWidth: 80,
      dataType: 'number',
      sortable: true,
      filterable: true,
      render: (row) => {
        const score = row.performance;
        let color = 'text-emerald-600';
        if (score < 70) color = 'text-red-600';
        else if (score < 85) color = 'text-amber-600';
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
              <div
                className={`h-full rounded-full ${score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${color}`}>{score}</span>
          </div>
        );
      },
    },
    {
      id: 'projects',
      title: '项目数',
      width: 90,
      minWidth: 70,
      dataType: 'number',
      sortable: true,
      filterable: true,
    },
    {
      id: 'overtimeHours',
      title: '加班时长',
      width: 110,
      minWidth: 90,
      dataType: 'number',
      sortable: true,
      filterable: true,
      render: (row) => (
        <span>{row.overtimeHours} <span className="text-xs text-slate-400">小时</span></span>
      ),
    },
    {
      id: 'satisfaction',
      title: '满意度',
      width: 100,
      minWidth: 80,
      dataType: 'number',
      sortable: true,
      filterable: true,
      render: (row) => (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <svg
              key={n}
              className={`w-4 h-4 ${n <= row.satisfaction ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      ),
    },
    {
      id: 'isManager',
      title: '管理者',
      width: 100,
      minWidth: 80,
      dataType: 'boolean',
      sortable: true,
      filterable: true,
      booleanTrueFirst: true,
    },
    {
      id: 'city',
      title: '城市',
      width: 100,
      minWidth: 80,
      dataType: 'enum',
      sortable: true,
      filterable: true,
      enumValues: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州'],
    },
    {
      id: 'email',
      title: '邮箱',
      width: 200,
      minWidth: 160,
      dataType: 'string',
      sortable: true,
      filterable: true,
      render: (row) => (
        <span className="text-blue-600 hover:underline cursor-pointer">
          {row.email}
        </span>
      ),
    },
    {
      id: 'phone',
      title: '电话',
      width: 130,
      minWidth: 110,
      dataType: 'string',
      sortable: true,
      filterable: true,
    },
    {
      id: 'joinDate',
      title: '入职日期',
      width: 130,
      minWidth: 110,
      dataType: 'date',
      sortable: true,
      filterable: true,
      render: (row) => format(row.joinDate, 'yyyy-MM-dd'),
    },
    {
      id: 'status',
      title: '状态',
      width: 100,
      minWidth: 80,
      dataType: 'enum',
      sortable: true,
      filterable: true,
      fixed: 'right',
      enumValues: ['在职', '离职', '试用期', '休假', '远程办公'],
      render: (row) => {
        const colors: Record<string, string> = {
          '在职': 'bg-emerald-100 text-emerald-800',
          '离职': 'bg-red-100 text-red-800',
          '试用期': 'bg-blue-100 text-blue-800',
          '休假': 'bg-amber-100 text-amber-800',
          '远程办公': 'bg-purple-100 text-purple-800',
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[row.status] || 'bg-slate-100 text-slate-600'}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      id: 'description',
      title: '员工描述',
      width: 300,
      minWidth: 200,
      dataType: 'string',
      sortable: false,
      filterable: true,
      getRowHeight: (row) => row.description ? 80 : 48,
    },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">高性能表格组件</h1>
              <p className="text-sm text-slate-500">百万级数据 · 虚拟滚动 · 排序筛选 · 列固定 · 导出</p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 bg-white/70 backdrop-blur border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">数据量:</label>
            <div className="flex gap-1">
              {[1000, 10000, 50000, 100000, 500000, 1000000].map((count) => (
                <button
                  key={count}
                  onClick={() => setDataCount(count)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    dataCount === count
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {count >= 1000000 ? `${count / 1000000}M` : count >= 1000 ? `${count / 1000}K` : count}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-2" />

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>总行数: <span className="font-semibold text-slate-800">{rawData.length.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>列数: <span className="font-semibold text-slate-800">{columns.length}</span></span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={showPerf}
                onChange={(e) => setShowPerf(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-slate-600">显示性能提示</span>
            </label>
          </div>
        </div>

        {showPerf && (
          <div className="mb-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-amber-800 space-y-1">
                <p className="font-semibold">功能使用说明</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                  <li><strong>排序:</strong> 点击表头排序，Shift+点击多列排序，点击顺序循环：升序→降序→无</li>
                  <li><strong>筛选:</strong> 点击表头漏斗图标打开筛选面板，支持多种操作符</li>
                  <li><strong>列宽调整:</strong> 拖拽列边界调整列宽，最小宽度限制为50px</li>
                  <li><strong>固定列:</strong> 工号、姓名固定在左侧，状态固定在右侧，横向滚动时不跟随移动</li>
                  <li><strong>选择:</strong> 启用复选框选择，支持跨页选择保留</li>
                  <li><strong>分页:</strong> 支持传统分页和无限滚动两种模式切换</li>
                  <li><strong>导出:</strong> 导出当前筛选后的全量数据为Excel或CSV</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <HighPerformanceTable<Employee>
          columns={columns}
          data={rawData}
          rowIdKey="id"
          loading={loading}
          height={600}
          pageSize={50}
          enableSelection={true}
          selectionColumnWidth={48}
          estimatedRowHeight={48}
          striped={true}
        />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '数据量级', value: '百万行', desc: '虚拟滚动流畅', icon: '🚀' },
            { label: '列固定', value: '左右两侧', desc: '支持任意列固定', icon: '📌' },
            { label: '数据类型', value: '5种+', desc: '智能排序筛选', icon: '🔢' },
            { label: '导出格式', value: 'Excel/CSV', desc: '全量数据导出', icon: '📊' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-xl">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                  <div className="text-base font-semibold text-slate-800">{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          高性能表格组件 · React 18 + Vite + TypeScript + Tailwind CSS + Zustand
        </div>
      </div>
    </div>
  );
}

export default App;
