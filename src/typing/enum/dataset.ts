import { enumMapToOptions } from '@/utils/helper';

// 数据集类型
export enum DatasetType {
  Review = 'review',
  Subscribe = 'subscribe',
}
const TYPE_MAP: Record<DatasetType, string> = {
  [DatasetType.Review]: '回顾数据集',
  [DatasetType.Subscribe]: '订阅数据集',
};

// 数据集数据源类型
export enum DatasetSourceType {
  Outpatient = 'outpatient',
  Inpatient = 'inpatient',
}
const SOURCE_TYPE_MAP: Record<DatasetSourceType, string> = {
  [DatasetSourceType.Outpatient]: '门诊',
  [DatasetSourceType.Inpatient]: '住院',
};

// 数据集数据源 Schema 列值类型
export enum DatasetSourceColumnType {
  String = 'string',
  Date = 'date',
  Int = 'int',
  Float = 'float',
  Bool = 'bool',
}
const SOURCE_COLUMN_TYPE_MAP: Record<DatasetSourceColumnType, string> = {
  [DatasetSourceColumnType.String]: '字符串',
  [DatasetSourceColumnType.Date]: '日期',
  [DatasetSourceColumnType.Int]: '整数',
  [DatasetSourceColumnType.Float]: '浮点数',
  [DatasetSourceColumnType.Bool]: '布尔值',
};

// 数据集 filter 逻辑
export enum DatasetFilterLogic {
  And = '$AND',
  Or = '$OR',
}
const FILTER_LOGIC_MAP: Record<DatasetFilterLogic, string> = {
  [DatasetFilterLogic.And]: '且（AND）',
  [DatasetFilterLogic.Or]: '或（OR）',
};

// 数据集 filter 操作符
export enum DatasetFilterOperator {
  Equal = '$eq',
  NotEqual = '$ne',
  GreaterThan = '$gt',
  GreaterThanOrEqual = '$gte',
  LessThan = '$lt',
  LessThanOrEqual = '$lte',
  Contains = '$contains',
  NotContains = '$not_contains',
}

const FILTER_OPERATOR_MAP: Record<DatasetFilterOperator, string> = {
  [DatasetFilterOperator.Equal]: '等于',
  [DatasetFilterOperator.NotEqual]: '不等于',
  [DatasetFilterOperator.GreaterThan]: '大于',
  [DatasetFilterOperator.GreaterThanOrEqual]: '大于等于',
  [DatasetFilterOperator.LessThan]: '小于',
  [DatasetFilterOperator.LessThanOrEqual]: '小于等于',
  [DatasetFilterOperator.Contains]: '包含',
  [DatasetFilterOperator.NotContains]: '不包含',
};

export enum DatasetResourceType {
  /// 门/急诊病历
  EmergencyRecord = 'emergency_record',
  /// 入院记录
  AdmissionRecord = 'admission_record',
  /// 首次病程记录
  FirstCourseRecord = 'first_course_record',
  /// 出院记录
  DischargeRecord = 'discharge_record',
  /// 手术前小结
  PreoperativeSummary = 'preoperative_summary',
  /// 手术记录
  SurgeryRecord = 'surgery_record',
  /// 实验室检查
  LaboratoryExamination = 'laboratory_examination',
  /// CT 报告
  CTReport = 'ct_report',
  /// MRI 报告
  MRIReport = 'mri_report',
  /// 超声报告
  UltrasoundReport = 'ultrasound_report',
  /// 病理报告
  PathologyReport = 'pathology_report',
  /// X光报告
  XRayReport = 'xray_report',
  /// 心电图报告
  ECGReport = 'ecg_report',
}
const RESOURCE_TYPE_MAP: Record<DatasetResourceType, string> = {
  [DatasetResourceType.EmergencyRecord]: '门/急诊病历',
  [DatasetResourceType.AdmissionRecord]: '入院记录',
  [DatasetResourceType.FirstCourseRecord]: '首次病程记录',
  [DatasetResourceType.DischargeRecord]: '出院记录',
  [DatasetResourceType.PreoperativeSummary]: '手术前小结',
  [DatasetResourceType.SurgeryRecord]: '手术记录',
  [DatasetResourceType.LaboratoryExamination]: '实验室检查',
  [DatasetResourceType.CTReport]: 'CT 报告',
  [DatasetResourceType.MRIReport]: 'MRI 报告',
  [DatasetResourceType.UltrasoundReport]: '超声报告',
  [DatasetResourceType.PathologyReport]: '病理报告',
  [DatasetResourceType.XRayReport]: 'X光报告',
  [DatasetResourceType.ECGReport]: '心电图报告',
};

export default {
  TYPE_MAP,
  TYPE_OPT: enumMapToOptions(TYPE_MAP),
  SOURCE_TYPE_MAP,
  SOURCE_TYPE_OPT: enumMapToOptions(SOURCE_TYPE_MAP),
  FILTER_LOGIC_MAP,
  FILTER_LOGIC_OPT: enumMapToOptions(FILTER_LOGIC_MAP),
  FILTER_OPERATOR_MAP,
  FILTER_OPERATOR_OPT: enumMapToOptions(FILTER_OPERATOR_MAP),
  RESOURCE_TYPE_MAP,
  RESOURCE_TYPE_OPT: enumMapToOptions(RESOURCE_TYPE_MAP),
  SOURCE_COLUMN_TYPE_MAP,
  SOURCE_COLUMN_TYPE_OPT: enumMapToOptions(SOURCE_COLUMN_TYPE_MAP),
};
