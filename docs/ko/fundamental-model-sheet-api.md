# Fundamental Model 입력값 출처·시트 데이터 API 가이드

백엔드 구현 제안 스웨거: [fundamental-model-sheet-api.openapi.yaml](fundamental-model-sheet-api.openapi.yaml). 엔드포인트와 응답 형식은 아직 백엔드와 확정되지 않았습니다.

이 문서는 `/mi/fundamental-model`에서 **수급모델 실행 → 입력값 출처 조회 → 기본 출처 선택 → 입력값 조회 → Demand / Supply / Trade / Output 표시** 흐름을 위한 백엔드 전달 문서입니다. 엑셀 업로드 출처에서는 파일 선택 즉시 업로드하고, 백엔드가 파싱한 응답으로 표를 표시합니다.

가장 중요한 협의 대상은 **프론트가 별도 데이터 가공 없이 화면을 그릴 수 있는 응답 스키마**입니다. URL, 출처 키의 실제 값, 기본 출처 선정 정책, 저장 방식은 백엔드에서 정해도 됩니다. 아래 경로와 키는 구현 제안이며 `mi-base`나 `MI BASE`를 확정값으로 하드코딩하지 않습니다. 변경 시 이 문서와 최종 Swagger를 함께 맞춥니다. 본문의 JSON은 도메인 응답 본문 기준이며, 기존 서비스의 공통 응답 envelope를 적용한다면 이를 포함한 최종 Swagger를 제공해야 합니다.

편집 초안 저장과 실행 케이스 생성·실행 API는 범위 밖입니다. 첫 번째 “수급모델 실행” 클릭은 입력 팝업을 여는 단계이며, 입력 조회나 파일 업로드만으로 모델을 실행하지 않습니다.

## 목표 호출 흐름

1. 수급모델 실행 팝업을 열 때 `GET /input-sources`로 입력값 출처 목록을 조회합니다.
2. `sources`를 응답 순서대로 표시하고, `defaultSourceKey`와 일치하는 `key`를 기본 선택합니다. MI Base가 기본값인지 여부는 백엔드가 결정합니다.
3. 선택 항목의 `type`이 `STORED`이면 `GET /inputs?sourceKey={선택한 key}`를 호출합니다. 이름이나 배열 첫 항목으로 기본값을 추측하지 않습니다.
4. 응답의 `sections → sheets → tables`로 탭·시트·표를 구성하고, 각 `sheets[].data`로 표를 그립니다. 네 종류의 메타데이터와 셀 데이터가 한 응답에 모두 있어야 합니다.
5. 출처 선택이 바뀌면 새 키로 다시 조회하고 네 종류의 표를 교체합니다. 이전 출처의 선택 상태·초안·데이터를 새 출처에 적용하지 않습니다.
6. 선택 항목의 `type`이 `EXCEL_UPLOAD`이면 기존 파일 선택/드롭존 기능을 사용합니다. 이 항목은 업로드 모드이므로 파일 선택 전에 일반 입력값 GET을 호출하지 않습니다.
7. 파일이 선택되면 `sourceKey`, `kind`, `file`을 담아 `POST /input-uploads`를 **즉시** 호출합니다. 네 파일이 모두 모이거나 확인/실행 버튼을 누를 때까지 기다리지 않습니다. 여러 파일을 선택하면 파일마다 요청합니다.
8. 업로드 성공 응답의 해당 `kind` 전체를 교체해 표시합니다. 로컬 Excel 파싱 결과나 업로드 파일 ID만으로 표를 만들지 않습니다. 나머지 종류의 업로드 성공 데이터는 유지합니다.

위 경로의 공통 prefix 제안은 `/api/v1/fundamental-model`입니다. 기존 문서의 별도 `input-sheet-catalog` 조회와 `file + sheetName` 단위 `input-sheet-preview` 제안은 이 흐름으로 대체합니다. 시트/표 선택 때 같은 파일을 재업로드하지 않습니다.

## API와 공통 응답 규격

| API 제안 | 요청 | 성공 응답 | 화면 반영 범위 |
| --- | --- | --- | --- |
| `GET /input-sources` | 없음 | `InputSourceList` | 출처 목록과 기본 선택 |
| `GET /inputs` | query `sourceKey` | `InputData` | 네 종류 전체 |
| `POST /input-uploads` | multipart `sourceKey`, `kind`, `file` | `InputData` | 업로드한 한 종류 전체 |

### 출처 목록: InputSourceList

```json
{
  "defaultSourceKey": "mi-base",
  "sources": [
    { "key": "mi-base", "label": "MI BASE", "type": "STORED" },
    { "key": "excel-upload", "label": "엑셀 업로드", "type": "EXCEL_UPLOAD" }
  ]
}
```

- `key`: 백엔드가 정하는 중복 없는 식별자. 프론트는 그대로 요청에 전달합니다.
- `label`: 화면 표시명. 기본값 판정이나 업로드 분기 조건으로 사용하지 않습니다.
- `type`: `STORED`는 저장된 입력값 조회, `EXCEL_UPLOAD`는 파일 선택 후 업로드입니다.
- `defaultSourceKey`: 반드시 목록에 있는 키이거나 `null`입니다. 기본값이 없으면 사용자가 선택할 때까지 입력값 조회를 기다립니다. 목록이 비어 있으면 `sources: []`, `defaultSourceKey: null`을 반환합니다. 잘못된 기본 키는 계약 오류이며 임의의 첫 항목으로 대체하지 않습니다.

### 조회·업로드 공통: InputData

| 필드 | 필수 | 의미 |
| --- | --- | --- |
| `sourceKey` | O | 요청한 출처 키. 현재 선택과 응답을 대조합니다. |
| `sections` | O | 종류별 입력 데이터 배열. GET은 `DEMAND`, `SUPPLY`, `TRADE`, `OUTPUT` 순서로 정확히 하나씩, 업로드는 요청한 종류 하나만 반환합니다. |
| `sections[].kind` | O | 위 네 종류 중 하나. 한 응답 안에서 중복하지 않습니다. |
| `sections[].inputId` | O | 해당 종류의 입력 스냅샷 식별자. 데이터·메타데이터 또는 업로드 파일이 바뀌면 변경합니다. 파일명으로 대체하지 않습니다. |
| `sections[].sheets` | O | 표시 순서의 시트 배열. 종류 안에서 `sheetName`은 중복하지 않습니다. 표시 대상이 없으면 `[]`입니다. |
| `sheets[].sheetName` | O | 원본 Excel 시트명. 다른 종류에 같은 이름이 있을 수 있으므로 `kind`와 함께 식별합니다. |
| `sheets[].tables` | O | 해당 시트의 표 메타데이터를 표시 순서로 반환합니다. `SheetTable` 스키마를 따릅니다. |
| `sheets[].data` | O | 헤더를 포함한 시트 전체 `SheetData`. 같은 시트의 여러 표가 공유합니다. |

`SheetTable`은 `id`, `kind`, `sheetName`, `name`, `description`, `location`, `rowPolicy`, `columnPolicy`, **`coordinates`**를 필수로 포함합니다. 표의 `kind`와 `sheetName`은 상위 값과 일치해야 하고, 표 `id`는 응답 전체에서 유일해야 합니다. 동일한 논리 표는 출처가 달라도 같은 `id`를 유지합니다.

`SheetData`는 **`columns`, `rows`, `inputCells`, `inputGuideRules`를 모두 필수**로 반환합니다. 편집 셀이 없거나 안내 규칙이 없으면 해당 배열은 `[]`입니다. 어떤 필드가 없다는 이유로 프론트의 mock이나 로컬 파서에서 값을 보충하지 않습니다. 별도 편집 표에서 참조하는 시트(예: RegasAdjustment가 참조하는 BCRegasification)도 같은 응답에 포함합니다.

조회와 업로드는 같은 스키마로 렌더링합니다. 아래는 **업로드 응답의 구조 설명용 축약 예시**입니다. 실제 응답에는 해당 종류의 모든 표시 시트·표와 시트 전체 데이터가 필요합니다.

```json
{
  "sourceKey": "excel-upload",
  "sections": [
    {
      "kind": "DEMAND",
      "inputId": "upload-demand-001",
      "sheets": [
        {
          "sheetName": "BCInput",
          "tables": [
            {
              "id": "DEMAND/BCInput/Base Case Hydrogen Demand",
              "kind": "DEMAND",
              "sheetName": "BCInput",
              "name": "Base Case Hydrogen Demand",
              "description": "국가별 수소 관련 가스 수요 기준정보",
              "location": "BB2:BE290",
              "rowPolicy": "기존 기준 유지",
              "columnPolicy": "기존 기준 유지",
              "coordinates": { "headerRow": 3, "bodyStart": 4 }
            }
          ],
          "data": {
            "columns": [
              { "field": "column53", "headerName": "BB" },
              { "field": "column54", "headerName": "BC" },
              { "field": "column55", "headerName": "BD" },
              { "field": "column56", "headerName": "BE" }
            ],
            "rows": [
              { "id": 2, "rowNumber": 3, "column53": "Country", "column54": "2025", "column55": "2026", "column56": "2027" },
              { "id": 3, "rowNumber": 4, "column53": "Korea", "column54": "1.00", "column55": "1.10" }
            ],
            "inputCells": [],
            "inputGuideRules": []
          }
        }
      ]
    }
  ]
}
```

일반 조회는 같은 구조의 `sections`에 네 종류를 모두 반환합니다. `OUTPUT`도 실행 전 입력 편집 화면에 필요한 설정·시트 데이터이며, 모델 실행 결과 조회를 뜻하지 않습니다.

### 업로드와 화면 상태

- 현재 업로드 UI는 종류별 한 파일, 최대 네 파일을 받습니다. `.xls`, `.xlsx`, `.xlsm`, 파일당 50 MiB(52,428,800 bytes)를 기준으로 합니다. 파일명에는 Demand/Supply/Trade/Output 중 하나만 대소문자 구분 없이 포함되어야 합니다. 백엔드도 파일 내용과 요청 `kind`의 정합성을 검증합니다.
- 한 파일만 선택해도 바로 업로드·표시할 수 있어야 합니다. 전체 네 파일이 필요한 실행 조건과 개별 파일 미리보기 조건은 구분합니다. 업로드 요청에 케이스명·설명·`sheetName`은 필요하지 않습니다.
- `200`은 파싱 완료와 렌더링 데이터 제공을 뜻합니다. 파일 ID/URL만 반환하는 응답은 충분하지 않습니다. 비동기 처리나 시트별 지연 조회가 필요하면 완료 조회 API까지 별도 합의하고 Swagger를 수정해야 합니다.
- 출처 전환 시 이전 출처의 데이터를 표시하지 않습니다. 로딩·실패·빈 데이터 상태를 구분하고, 실패를 빈 성공 데이터로 처리하지 않습니다. 업로드 출처로 새로 전환한 경우 파일 선택 상태에서 시작합니다.
- 파일 교체 중에는 해당 종류의 이전 표를 새 파일의 결과처럼 표시하지 않습니다. 실패한 종류는 오류/재시도 상태로 두고 다른 종류의 성공 데이터는 유지합니다.
- 프론트는 출처 전환 및 같은 종류의 파일 교체에 요청 순번/취소 처리를 적용해 **현재 선택에 대한 최신 요청 응답만** 반영합니다. `sourceKey` 비교만으로는 같은 출처의 파일 교체나 A→B→A 전환을 구분할 수 없습니다.
- 캐시·초안은 출처와 `kind`, `inputId`, 표 `id`로 격리합니다. `inputId`의 저장 방식·유효기간·향후 실행 API 전달 방식은 백엔드가 정하며, 이번 미리보기 계약이 편집 저장이나 실행 연동까지 구현됐다는 의미는 아닙니다.

### 빈 데이터와 오류

빈 출처 목록과 빈 종류는 위 배열 규칙을 따릅니다. 존재하는 빈 시트는 `tables` 메타데이터와 함께 빈 `data` 배열을 반환할 수 있습니다. 단, 좌표나 편집 규칙상 필요한 빈 열·입력 셀이 있으면 이를 보존합니다. 필수 시트 누락은 빈 시트로 숨기지 않고 검증 오류로 반환합니다.

오류 본문은 공통 `ApiError`인 `{ "code": "...", "message": "...", "details": [...] }`입니다. `code`, 사용자에게 표시할 `message`는 필수이며 `details`는 선택입니다. 상세 항목은 `message`와 필요한 경우 `kind`, `sheetName`을 포함합니다.

| HTTP | 용도 / 코드 예시 |
| --- | --- |
| `400` | 잘못된 요청 또는 출처 타입과 API 불일치 / `INVALID_REQUEST` |
| `404` | 선택한 출처를 더 이상 사용할 수 없음 / `SOURCE_NOT_FOUND` |
| `413` | 파일 크기 초과 / `FILE_TOO_LARGE` |
| `415` | 지원하지 않는 파일 형식 / `UNSUPPORTED_FILE_TYPE` |
| `422` | 읽을 수 없는 워크북, 필수 시트 누락, 종류·구조 불일치 / `WORKBOOK_VALIDATION_FAILED` |
| `500` | 입력값 조회 또는 처리 실패 / `INPUT_LOAD_FAILED` |

출처 조회 실패 시 재시도할 수 있어야 하며, 입력값 조회에서 출처가 사라졌다면 목록을 다시 조회해 재선택합니다. 실패한 요청을 다른 출처나 mock으로 자동 대체하지 않습니다.

## 현재 프론트 동작

- `getFundamentalModelSheetCatalog`은 `sheetTableOrder`, `summaryTemplateDefinitions`, `summaryTemplateCoordinates`를 결합해 목록을 반환하는 임시 mock입니다. 빈 `.tsx` 파일을 검색하지 않습니다.
- `getFundamentalModelSheetDataPreview`는 업로드한 Excel 파일의 요청 시트 하나를 Web Worker에서 파싱해 반환하는 임시 mock입니다. 같은 파일·시트의 결과는 캐시합니다.
- 화면은 목록 응답의 `tables` 순서대로 시트와 테이블 버튼을 표시합니다. `id`로 선택 상태와 편집 초안을 식별합니다. 표의 범위와 편집 규칙은 응답의 `location`, `rowPolicy`, `columnPolicy`, `coordinates`를 사용합니다.
- 3개 표는 현재 별도 편집 동작이 있어 `id`에 따라 전용 컴포넌트를 사용합니다: `SUPPLY/LiqUtilAdjustment/Monthly LNG Train Utilization`, `SUPPLY/BCRegasification/Annual Regas Capacity Baseline`, `SUPPLY/RegasAdjustment/Monthly Regas Capacity Adjustment`.
- 나머지 표는 `sheetTemplateRegistry.ts`의 로더에서 공통 `SummarySheetTemplate`으로 표시합니다. Output 개별 컴포넌트 6개와 `PNGProductionAdjustment` 파일은 현재 로더에서 사용하지 않습니다. 파일의 존재나 컴포넌트 이름으로 API의 표시 대상 표를 결정하지 않습니다.
- 프론트 파일명·컴포넌트명은 API의 표 `id`·`name`과 별개입니다. 내부 `Table01`·`Table02`를 파일명에 맞춘 컴포넌트명으로 정리해도 기존 논리 식별자, 표시명, 좌표와 요청·응답 스키마는 유지합니다.
- 편집 초안은 업로드한 `File`과 테이블 `id`별로 프론트 메모리에 유지합니다. 현재 실행 케이스 생성 요청에는 원본 파일을 전달하며, 화면의 편집 초안을 파일에 반영하거나 별도 API로 저장하는 처리는 연결되어 있지 않습니다.

## 테이블 표시 규칙

- 헤더는 `coordinates.headerRows` 또는 기간 행 설정과 `headerRow`를 이용해 원본 행 순서대로 표시합니다. `Year / Month / Period`처럼 왼쪽에 있는 행 라벨도 셀 값으로 반환해야 합니다. 단일 헤더 열은 기존 병합 배치를 유지하고, 기간 열의 마지막 헤더 칸이 비어 있으면 `G / H` 같은 Excel 열 이름으로 채우지 않습니다. 기간 값 아래와 헤더 하단의 구분선은 유지합니다.
- 헤더 폭은 각 레이어의 텍스트와 핀·메뉴 공간을 함께 고려합니다. `columns.headerName`은 Excel 열 식별용 기본 이름이며, 다중 헤더의 실제 표시 문자열은 해당 `rows`에서 읽습니다.
- 가로 스크롤이 있을 때 헤더의 핀으로 열을 고정·해제합니다. 다중 헤더에서는 최상위 표시 헤더에 핀을 두고, 열 메뉴가 있는 경우 메뉴 왼쪽에 배치합니다. 가로 스크롤이 없으면 핀을 숨깁니다. 고정 열의 원래 순서는 유지합니다.
- 가로 스크롤의 남은 영역과 고정 열 경계에 그림자를 표시합니다. 고정 열의 그림자는 해당 헤더 내부에 배치해 열과 함께 움직이고, 180ms 불투명도 전환으로 나타나고 사라집니다. 동작 줄이기 설정에서는 전환을 생략합니다. 표의 가장 왼쪽 바깥 경계에는 그림자를 표시하지 않습니다.
- 공통 테이블의 셀은 편집 가능 여부와 관계없이 숫자 값을 우측 정렬합니다. 소수, 부호가 있는 숫자, 천 단위 쉼표, 지수 표기, 퍼센트 문자열을 포함하며 문자는 좌측 정렬합니다. 표시 문자열 자체는 바꾸지 않습니다. 전용 편집 테이블은 기존 숫자 열 정렬도 유지합니다.
- 핀 상태·스크롤 위치·그림자·텍스트 정렬은 프론트 표시 동작입니다. 이번 API 응답에 별도의 고정 열, 정렬, 스타일 필드를 추가할 필요는 없습니다. 핀 상태는 컴포넌트 내부 상태이며 테이블 재진입 시 저장된 초안에서 복원하지 않습니다.

## 백엔드 구현 요청

1. 출처 목록·기본 키와 저장/업로드 구분을 명시적으로 제공합니다. 기본 출처, 최신 MI Base 해석 및 권한에 따른 목록은 백엔드 책임입니다.
2. 조회 또는 업로드 응답에 표 메타데이터와 셀 데이터를 함께 제공합니다. 각 배열은 화면 표시 순서이며 프론트는 별도로 정렬하지 않습니다. 현재 v3 기준 151개 표의 값과 순서는 이관 참고자료이고, 표 개수를 고정하지 않습니다. 현재 논리 식별자는 `kind/sheetName/name`입니다. 전용 컴포넌트도 이 값에 의존하므로 식별자 변경 시 프론트 매핑 변경이 필요합니다.
3. `SheetData`는 **시트 전체**를 담습니다. 선택 표의 본문만 잘라 보내지 않으며 `bodyStart` 이전 헤더도 포함합니다. `columns`는 원본 열 인덱스의 `columnN`과 Excel 열 이름을 사용하고, `rows`는 원본 `rowNumber` 오름차순입니다. `id`는 시트 내에서 유일하고 안정적이어야 합니다. 빈 행·셀 필드는 생략 가능하지만 원본 번호를 재번호화하지 않습니다. 표 좌표·헤더·빈 편집 셀에 필요한 열은 값이 없어도 `columns`에 포함합니다.
4. 셀 값은 표시할 문자열 또는 숫자로 반환합니다. 현재 Excel 파서는 표시 문자열(`w`), 원시 값(`v`)의 문자열, 수식(`=...`) 순으로 사용합니다. 백엔드도 퍼센트·소수 자릿수·쉼표 등의 표시를 보존하고 날짜·불리언 등은 표시 문자열로 전달합니다. `null`, 셀 객체, 헤더 빈칸을 채우는 임의 문구는 사용하지 않습니다.
5. 편집 가능한 셀은 `inputCells`에 `rowNumber * 16384 + zeroBasedColumnIndex`로 담습니다. 빈 입력 셀도 포함하며 `G11`은 `180230`입니다. `플랫폼 입력 안내` 시트가 있으면 해당 범위 규칙을 사용하고, 안내 시트 자체가 없을 때만 노란색 셀 스타일을 감지합니다. 안내 시트에 해당 시트의 규칙이 없는 경우 노란색 감지로 돌아가지 않습니다. 두 경로 모두 수식 셀은 제외합니다. `inputGuideRules`의 행은 1 기반, 열은 0 기반이고 시작·끝 좌표를 포함합니다. 일반 표의 원본 셀 판정은 `inputCells`, 추가 열 허용은 `forceEditableColumns`를 사용하며 전용 컴포넌트의 추가 편집 규칙은 유지합니다.
6. 백엔드가 확정한 Swagger에서 인터페이스를 생성합니다. 프론트의 기존 mock 형태로 실제 응답을 변환하는 어댑터는 만들지 않고, 컴포넌트가 최종 응답을 직접 사용하도록 연동합니다.

## v3 파일 반영 사항

- `입력 / 업무 정합성`도 `입력`과 같은 `scenario` 역할로 처리합니다. 수식 셀은 계속 편집 대상에서 제외하며, `사용 안 함`, `파생값`, `참고/연계`, `필수 연결` 등을 입력 역할로 변환하지 않습니다.
- Demand `General`의 국가·부문·세부부문·연도·월 목록은 `DEMAND/General/Demand Dropdown` 하나로 반환합니다. 범위는 `K2:O93`, 헤더는 2행, 본문은 3행부터입니다. Power Mix 국가·에너지원 목록은 `DEMAND/General/Power Mix Dropdown` 하나로 반환하며 범위는 `R1:S93`, 헤더는 2행, 본문은 3행부터입니다. 각 열의 원본 값과 빈칸을 그대로 보존합니다.
- Supply `ProductionAdjustment`에서 미사용 `Annual Province Production Adjustment (Legacy)`는 목록에서 제외합니다. 원본 시트와 보조 수식은 보존하며 `PNG Production Adjustment`는 유지합니다.
- Trade `4.5 PriceModelInput`의 `Henry Hub - User-Adjusted`는 `Shipping Cost - User-Adjusted` 다음에 표시합니다. 범위는 `K14:P23`, 헤더는 15행, 본문은 16행부터이며 직접 입력 표가 아닙니다.
- Output `PremiumCalc`는 TTF·East Asia Spot 입력표만, `AnnualPriceCalc`는 Spread 설정만 목록에 포함합니다. v3에서 숨김/대상 아님으로 지정한 계산·참고표 11개는 목록에서 제외하며 원본 데이터와 계산 연결은 보존합니다.

## 좌표 설정

이번 계약에서 `coordinates`는 모든 표의 필수 필드입니다. 현재 공통 테이블에 범위 추정 fallback이 있더라도 백엔드가 좌표를 생략하는 근거로 삼지 않습니다. `location`과 좌표는 같은 원본 범위를 설명해야 합니다.

| 필드 | 의미 |
| --- | --- |
| `headerRow` | 기본 헤더의 원본 행 번호. `0`은 원본 헤더 행 없이 `headerLabels`로 제목을 지정하는 예외입니다. 본문의 실제 행 번호는 계속 1 기반입니다. |
| `headerRows` | 표시할 헤더 행을 위에서 아래 순서대로 지정합니다. 생략하면 `periodYearRow`, `periodMonthRow`, `periodCountRow`, `headerRow` 순서에서 중복을 제거해 구성합니다. |
| `bodyStart` | 본문이 시작되는 원본 행 번호입니다. |
| `firstColumn`, `lastColumn`, `firstRow`, `lastRow` | 표 범위의 시작·끝 좌표입니다. 열은 `B`, `BB` 같은 Excel 문자, 행은 1 기반 번호이며 양 끝을 포함합니다. |
| `columns` | 연속 범위 대신 표시할 Excel 열을 배열 순서대로 지정합니다. |
| `headerLabels` | Excel 열 문자를 키로 사용하는 명시적 제목 설정입니다. 원본 제목이 없는 표 등에 사용합니다. |
| `forceEditableColumns` | 셀 주소 목록과 별도로 편집을 허용할 Excel 열입니다. |
| `periodYearRow`, `periodMonthRow`, `periodCountRow` | 연도·월·기간 값이 있는 원본 행 번호입니다. 왼쪽 행 라벨도 같은 행에서 반환합니다. |
| `periodFirstColumn` | 월별 열의 시작 Excel 열입니다. 이 열부터 연도·월 값이 모두 있는 열을 선택합니다. |
| `addColumnAfter` | 새 열을 추가할 기준 Excel 열입니다. 생략 시 마지막 표시 열 뒤에 추가합니다. |

`rowPolicy`, `columnPolicy`는 기존 표시 문구를 유지합니다. 공통 테이블은 `가능`일 때 행·열 추가 동작을 활성화하며, 나머지 문구를 임의로 `가능`으로 변환하지 않습니다. `LNG Demand Mode`의 열 추가와 전용 테이블의 편집 동작에는 별도 예외가 있습니다.

## 표 메타데이터와 다중 헤더 예시

```json
{
  "tables": [
    {
      "id": "DEMAND/BCInput/Base Case Hydrogen Demand",
      "kind": "DEMAND",
      "sheetName": "BCInput",
      "name": "Base Case Hydrogen Demand",
      "description": "국가별 수소 관련 가스 수요 기준정보",
      "location": "BB2:BE290",
      "rowPolicy": "기존 기준 유지",
      "columnPolicy": "기존 기준 유지",
      "coordinates": { "headerRow": 3, "bodyStart": 4 }
    }
  ]
}
```

위 예시는 `sheets[]` 안의 `tables`만 발췌한 것입니다. 독립된 목록 API 응답이 아닙니다.

다중 헤더 예시인 `SUPPLY/LiqProdAdjustment/Monthly LNG Train Production`의 좌표는 다음과 같습니다. `headerRows`를 생략해도 아래 기간 행과 `headerRow`로 `[7, 8, 9, 10]`이 구성됩니다.

```json
{
  "headerRow": 10,
  "bodyStart": 11,
  "periodYearRow": 7,
  "periodMonthRow": 8,
  "periodCountRow": 9,
  "periodFirstColumn": "G"
}
```

다음은 `sheets[].data`의 표시 구조 설명용 예시입니다. `F:H` 열과 일부 행만 발췌했으며, 실제 응답은 시트 전체 범위를 반환합니다. `column6`, `column7`의 10행은 빈 칸이므로 필드를 생략했습니다. `G11`, `H11`은 값이 없어도 편집 가능한 주소를 반환합니다.

```json
{
  "columns": [
    { "field": "column5", "headerName": "F" },
    { "field": "column6", "headerName": "G" },
    { "field": "column7", "headerName": "H" }
  ],
  "rows": [
    { "id": 6, "rowNumber": 7, "column5": "Year", "column6": "2025", "column7": "2025" },
    { "id": 7, "rowNumber": 8, "column5": "Month", "column6": "1", "column7": "2" },
    { "id": 8, "rowNumber": 9, "column5": "Period", "column6": "85", "column7": "86" },
    { "id": 9, "rowNumber": 10, "column5": "Nameplate Capacity (MTPA)" },
    { "id": 10, "rowNumber": 11, "column5": "4.50" }
  ],
  "inputCells": [180230, 180231],
  "inputGuideRules": []
}
```

## 연동 시 전환 지점

- 목록 mock: `src/pages/mi/fundamentalModel/components/sheetTemplates/fundamentalModelSheetCatalogMock.ts`
- 시트 미리보기 mock: `src/pages/mi/fundamentalModel/components/fundamentalModelSheetDataMock.ts`
- 백엔드 스웨거가 확정되면 그 스키마로 인터페이스를 생성하고 위 두 mock을 제거한 뒤 실제 API 서비스로 교체합니다. 실제 응답을 기존 mock 형식으로 변환하지 않습니다.
- 기존 `File` 기반 시트 조회·캐시를 출처와 입력 스냅샷 기반으로 전환하고, 파일 선택 시 업로드 API를 연결합니다. 출처 선택 UI와 API 연동은 후속 프론트 구현 범위입니다.

## 백엔드 구현 완료 확인 기준

- 기본 키를 바꾸면 프론트 하드코딩 없이 해당 출처가 선택되고, 그 키로 입력값 조회가 가능합니다.
- 일반 조회 한 번으로 네 종류의 표 목록·좌표·헤더·셀·편집 가능 셀이 제공됩니다. 출처별 데이터 차이와 빈 데이터가 구분됩니다.
- 한 파일 선택만으로 즉시 업로드 및 해당 종류의 표 표시가 가능하고, 조회와 업로드는 같은 `InputData` 스키마를 사용합니다.
- 표 ID, 상위 종류·시트명 일치, 기본 키 참조, GET의 네 종류/업로드의 한 종류 규칙을 검증합니다. 이 교차 필드 제약은 OpenAPI 3.0의 타입 검사 외에 백엔드 검증이 필요합니다.
- 다중 헤더의 왼쪽 라벨·빈칸, 빈 편집 셀, 형식화된 숫자, 전용 표의 참조 시트가 보존됩니다.
- 파일 교체 시 입력 스냅샷 식별자가 바뀌며, 누락 시트·잘못된 파일·사용 불가 출처 오류가 문서화된 형식으로 반환됩니다.
- 최종 경로, 공통 envelope, 출처 키·기본값 정책, `inputId` 수명과 향후 실행 연동 방식을 Swagger 및 관련 실행 API 문서에 확정합니다.
