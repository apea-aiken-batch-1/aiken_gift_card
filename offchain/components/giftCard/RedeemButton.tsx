import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/modal";

import { Action } from "@/types/action";

export default function RedeemButton(props: { onSubmit: Action }) {
  const { onSubmit } = props;

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  function getPolicyID() {
    const policyID = document.getElementById("policy-id") as HTMLInputElement;
    return policyID.value;
  }

  return (
    <>
      <Button className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize" radius="full" onPress={onOpen}>
        Redeem
      </Button>

      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Create Gift Card</ModalHeader>
              <ModalBody>
                <Input id="policy-id" label="Token Policy" placeholder="Enter Policy ID" variant="bordered" autoFocus />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    onSubmit(getPolicyID());
                    onClose();
                  }}
                >
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
