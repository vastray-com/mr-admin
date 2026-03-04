import dataset from './dataset';
import downloadTask from './downloadTask';
import pushRule from './pushRule';
import structuredRuleset from './structuredRuleset';
import task from './task';
import warehouse from './warehouse';

export const ENUM_VARS = {
  DATASET: dataset,
  RULESET: structuredRuleset,
  TASK: task,
  PUSH_RULE: pushRule,
  WAREHOUSE: warehouse,
  DOWNLOAD_TASK: downloadTask,
};

// 用户角色
export enum UserRole {
  Admin = 'admin',
  User = 'user',
}
