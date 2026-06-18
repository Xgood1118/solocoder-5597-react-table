import { addDays } from 'date-fns';

const FIRST_NAMES = [
  '张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '胡', '朱', '郭', '何', '高', '林', '罗'
];
const LAST_NAMES = [
  '伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平'
];
const DEPARTMENTS = ['研发部', '产品部', '设计部', '市场部', '销售部', '运营部', '人力资源部', '财务部', '法务部', '行政部'];
const POSITIONS = ['工程师', '高级工程师', '技术专家', '架构师', '经理', '总监', '副总裁', '主管', '专员', '助理'];
const STATUS = ['在职', '离职', '试用期', '休假', '远程办公'];
const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州'];

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

export interface Employee {
  id: string;
  employeeNo: string;
  name: string;
  age: number;
  gender: string;
  department: string;
  position: string;
  salary: number;
  city: string;
  email: string;
  phone: string;
  joinDate: Date;
  status: string;
  performance: number;
  isManager: boolean;
  description: string;
  projects: number;
  overtimeHours: number;
  satisfaction: number;
  level: string;
}

export function generateMockData(count: number): Employee[] {
  const employees: Employee[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = randomFromArray(FIRST_NAMES);
    const lastName = randomFromArray(LAST_NAMES);
    const name = firstName + lastName;
    const joinDate = addDays(new Date('2015-01-01'), randomInt(0, 3650));
    const age = randomInt(22, 55);
    const salary = randomInt(8000, 80000);
    const performance = randomInt(60, 100);
    const projects = randomInt(1, 20);
    const overtimeHours = randomInt(0, 200);
    const satisfaction = randomInt(1, 5);
    const levels = ['P5', 'P6', 'P7', 'P8', 'P9', 'M1', 'M2', 'M3'];
    const isManager = randomBoolean();

    employees.push({
      id: `EMP_${String(i + 1).padStart(8, '0')}`,
      employeeNo: `E${randomInt(100000, 999999)}`,
      name,
      age,
      gender: randomBoolean() ? '男' : '女',
      department: randomFromArray(DEPARTMENTS),
      position: randomFromArray(POSITIONS),
      salary,
      city: randomFromArray(CITIES),
      email: `user${i + 1}@company.com`,
      phone: `1${randomInt(30, 99)}${String(randomInt(10000000, 99999999))}`,
      joinDate,
      status: randomFromArray(STATUS),
      performance,
      isManager,
      description: i % 5 === 0
        ? `${name}是公司的资深员工，具有丰富的行业经验。在过去的工作中展现出卓越的领导能力和团队协作精神，多次获得公司表彰。负责多个核心项目的架构设计和实施，对公司技术发展做出了重要贡献。`
        : '',
      projects,
      overtimeHours,
      satisfaction,
      level: randomFromArray(levels),
    });
  }

  return employees;
}
