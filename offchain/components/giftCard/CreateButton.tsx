import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/modal";

import { Action } from "@/types/action";

export default function CreateButton(props: { onSubmit: Action }) {
  const { onSubmit } = props;

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  function getLovelace() {
    const giftAmount = document.getElementById("gift-amount") as HTMLInputElement;
    const adaLovelace = giftAmount.value.split(".");
    return BigInt(adaLovelace[0] || 0) * 1_000000n + BigInt(adaLovelace[1] || 0);
  }

  function getTokenName() {
    const tokenName = document.getElementById("token-name") as HTMLInputElement;
    return tokenName.value;
  }

  function getImageURL() {
    const imageURL = document.getElementById("image-url") as HTMLInputElement;
    return imageURL.value;
  }

  return (
    <>
      <Button className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize" radius="full" onPress={onOpen}>
        Create
      </Button>

      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Create Gift Card</ModalHeader>
              <ModalBody>
                <Input id="token-name" label="Token Name" placeholder="Enter token name" variant="bordered" autoFocus />
                <Input id="image-url" label="Image URL" placeholder="Enter image URL" variant="bordered" />
                <Input
                  id="gift-amount"
                  label="Gift Amount"
                  labelPlacement="outside"
                  placeholder="0.000000"
                  variant="bordered"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">ADA</span>
                    </div>
                  }
                  type="number"
                  min={0}
                  max={45_000_000_000}
                  step={1}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    onSubmit({ lovelace: getLovelace(), tokenName: getTokenName(), imageURL: getImageURL() });
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
