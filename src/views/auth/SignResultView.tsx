import { $t } from '@/_utils/i18n'
import { NButton, NFlex, NResult } from 'naive-ui'
import { computed, defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApprovalProcessNameEnum } from '@/modules/approval/application/constants'
import { match } from 'ts-pattern'
import { ServiceAgreementStatusEnum } from '@/modules/service-agreement/application/constants'
import { message } from '@/_utils/discrete_naive_api'
import type { PropType } from 'vue'
import type { ServiceAgreementStatus } from '@/modules/service-agreement/application/models'

export default defineComponent({
  name: 'sign-result',
  props: {
    id: { type: Number, required: true },
    status: { type: Number as PropType<ServiceAgreementStatus>, required: true },
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const initialSuccess = computed(() => route.query.status && route.query.id)
    const successTitle = computed(() => {
      return match(props.status)
        .with(ServiceAgreementStatusEnum.Record, () => $t('serviceAgreement.result.filingSuccess'))
        .with(ServiceAgreementStatusEnum.Sign, () => $t('serviceAgreement.result.signSuccess'))
        .otherwise(() => '')
    })
    function returnBtnClick() {
      router.go(-2)
    }
    function seeDetailBtnClick() {
      match(props.status)
        .with(ServiceAgreementStatusEnum.Record, () => {
          router.push({
            name: 'sign',
            query: {
              id: route.query.id,
            },
          })
        })
        .with(ServiceAgreementStatusEnum.Sign, () => {
          router.push({
            name: 'approval-instance-detail',
            query: {
              template: ApprovalProcessNameEnum.SIGN,
              instanceId: route.query.id,
            },
          })
        })
        .otherwise(() => {
          message.error($t('exception.routeQueryInvaild.title'))
        })
    }
    return () => (
      <>
        {!initialSuccess.value && (
          <NResult size="huge" status={'error'} title={$t('exception.routeQueryInvaild.title')}>
            <NButton size="large" onClick={returnBtnClick}>
              {$t('actions.return')}
            </NButton>
          </NResult>
        )}
        {initialSuccess.value && (
          <NResult status={'success'} title={successTitle.value} size="huge">
            <NFlex justify="center">
              <NButton size="large" onClick={returnBtnClick}>
                {$t('actions.return')}
              </NButton>
              <NButton size="large" onClick={seeDetailBtnClick}>
                {$t('actions.read')}
              </NButton>
            </NFlex>
          </NResult>
        )}
      </>
    )
  },
})
