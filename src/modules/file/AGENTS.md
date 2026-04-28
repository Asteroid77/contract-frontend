# File Agent Notes

## Entry Points

- `application/file-service.ts`
- `application/hooks/useFileService.ts`
- `infrastructure/file-repository.ts`

## Local Commands

- `pnpm test:unit --run`

## Boundaries

- 本模块保持只读语义，不新增上传、删除等写操作。
- 批量查询要继续回填单条缓存。
- `staleTime` / `gcTime` 与 OSS URL 过期时间绑定，改动前先确认缓存语义。

## High-Risk Changes

- URL 过期缓存策略
- 批量查询回填逻辑

## Related Source-Of-Truth Docs

- `../../../docs/index.md`
