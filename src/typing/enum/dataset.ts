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

// 数据集 filter 表名
export enum DatasetFilterTable {
  /// 门/急诊病历
  EmergencyRecord = '#emergency_record',
  /// 入院记录
  AdmissionRecord = '#admission_record',
  /// 首次病程记录
  FirstCourseRecord = '#first_course_record',
  /// 出院记录
  DischargeRecord = '#discharge_record',
  /// 手术前小结
  PreoperativeSummary = '#preoperative_summary',
  /// 手术记录
  SurgeryRecord = '#surgery_record',
  /// 实验室检查
  LaboratoryExamination = '#laboratory_examination',
  /// CT 报告
  CTReport = '#ct_report',
  /// MRI 报告
  MRIReport = '#mri_report',
  /// 超声报告
  UltrasoundReport = '#ultrasound_report',
  /// 病理报告
  PathologyReport = '#pathology_report',
  /// X光报告
  XRayReport = '#xray_report',
  /// 心电图报告
  ECGReport = '#ecg_report',
}
const FILTER_TABLE_MAP: Record<DatasetFilterTable, string> = {
  [DatasetFilterTable.EmergencyRecord]: '门/急诊病历',
  [DatasetFilterTable.AdmissionRecord]: '入院记录',
  [DatasetFilterTable.FirstCourseRecord]: '首次病程记录',
  [DatasetFilterTable.DischargeRecord]: '出院记录',
  [DatasetFilterTable.PreoperativeSummary]: '手术前小结',
  [DatasetFilterTable.SurgeryRecord]: '手术记录',
  [DatasetFilterTable.LaboratoryExamination]: '实验室检查',
  [DatasetFilterTable.CTReport]: 'CT 报告',
  [DatasetFilterTable.MRIReport]: 'MRI 报告',
  [DatasetFilterTable.UltrasoundReport]: '超声报告',
  [DatasetFilterTable.PathologyReport]: '病理报告',
  [DatasetFilterTable.XRayReport]: 'X光报告',
  [DatasetFilterTable.ECGReport]: '心电图报告',
};

export default {
  TYPE_MAP,
  TYPE_OPT: enumMapToOptions(TYPE_MAP),
  FILTER_LOGIC_MAP,
  FILTER_LOGIC_OPT: enumMapToOptions(FILTER_LOGIC_MAP),
  FILTER_OPERATOR_MAP,
  FILTER_OPERATOR_OPT: enumMapToOptions(FILTER_OPERATOR_MAP),
  FILTER_TABLE_MAP,
  FILTER_TABLE_OPT: enumMapToOptions(FILTER_TABLE_MAP),
};
