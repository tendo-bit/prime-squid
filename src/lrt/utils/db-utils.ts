import {
  Entity,
  EntityClass,
  FindManyOptions,
  FindOneOptions,
} from '@subsquid/typeorm-store/src/store'
import { EntityManager } from 'typeorm'

import { Context } from '../../processor'

export const find = <E extends Entity>(
  ctxOrEm: Context | EntityManager,
  entityClass: EntityClass<E>,
  options?: FindManyOptions<E>,
) => {
  return 'store' in ctxOrEm
    ? ctxOrEm.store.find(entityClass, options)
    : ctxOrEm.find(entityClass, options)
}

export const findOne = <E extends Entity>(
  ctxOrEm: Context | EntityManager,
  entityClass: EntityClass<E>,
  options: FindOneOptions<E>,
) => {
  return 'store' in ctxOrEm
    ? ctxOrEm.store.findOne(entityClass, options)
    : ctxOrEm.findOne(entityClass, options).then((e) => e ?? undefined)
}
